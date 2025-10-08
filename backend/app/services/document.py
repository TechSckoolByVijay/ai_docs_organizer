"""
Document service for file handling, upload, and management.
"""
import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.models import Document, User
from app.schemas import DocumentCreate, DocumentResponse
from app.services.category import CategoryService
from app.services.file_processing import FileProcessingService
from app.services.azure_blob import AzureBlobService
from app.services.azure_search import AzureSearchService


class DocumentService:
    """Service for document management operations."""
    
    def __init__(self):
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB default
        self.allowed_extensions = os.getenv("ALLOWED_EXTENSIONS", ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx").split(",")
        self.file_processor = FileProcessingService()
        
        # Initialize Azure services (all required)
        try:
            self.blob_service = AzureBlobService()
            self.search_service = AzureSearchService()
            print("Azure Blob Storage and Search services initialized")
        except Exception as e:
            raise RuntimeError(f"Azure Blob Storage and Search services are required but not available: {e}")
        
        # Initialize Service Bus for async processing (required)
        try:
            from app.services.azure_servicebus import AzureServiceBusService
            self.servicebus = AzureServiceBusService()
            print("Azure Service Bus initialized")
        except Exception as e:
            raise RuntimeError(f"Azure Service Bus is required but not available: {e}")
    
    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file."""
        # Check file size
        if hasattr(file, 'size') and file.size > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {self.max_file_size} bytes"
            )
        
        # Check file extension
        if file.filename:
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in self.allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}"
                )
    
    async def upload_document(
        self, 
        db: Session, 
        user: User, 
        file: UploadFile,
        category: Optional[str] = None
    ) -> DocumentResponse:
        """Upload and process a document."""
        try:
            # Validate file
            self.validate_file(file)
            
            # Upload to Azure Blob Storage
            blob_path, file_size = self.blob_service.upload_file(user.id, file)
            
            # Process file for text extraction
            file_content = self.blob_service.download_file(blob_path)
            if not file_content:
                # Clean up blob if download fails
                self.blob_service.delete_file(blob_path)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to process uploaded file"
                )
            
            # Save temporarily for processing
            temp_path = f"/tmp/{uuid.uuid4()}"
            with open(temp_path, "wb") as temp_file:
                temp_file.write(file_content)
            
            try:
                extracted_text, detected_intent = self.file_processor.extract_text(
                    temp_path, file.content_type or "application/octet-stream"
                )
            finally:
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            # Auto-categorize if no category provided
            if not category:
                auto_category, confidence, keywords = CategoryService.auto_categorize(
                    filename=file.filename or "",
                    extracted_text=extracted_text
                )
                category = auto_category
            else:
                # Validate provided category
                normalized_category = CategoryService.normalize_category_input(category)
                if normalized_category:
                    category = normalized_category
                else:
                    category = "other"
            
            # Create document record
            document = Document(
                user_id=user.id,
                original_filename=file.filename or "unnamed",
                file_path=blob_path,  # Store blob path
                category=category,
                file_size=file_size,
                content_type=file.content_type or "application/octet-stream",
                extracted_text=extracted_text,
                detected_intent=detected_intent,
                processing_status="completed",
                processed_at=datetime.utcnow()
            )
            
            db.add(document)
            db.commit()
            db.refresh(document)
            
            # Index to Azure AI Search via Service Bus (async processing)
            print(f"Sending document {document.id} to Service Bus for indexing...")
            
            try:
                await self.servicebus.send_search_indexing_message(
                    document.id, 
                    user.id, 
                    action="index"
                )
                print(f"Successfully sent document {document.id} to Service Bus for indexing")
            except Exception as e:
                print(f"Failed to index document: {e}")
                # Don't fail the upload if indexing fails
            
            # Send notification about successful upload
            try:
                notification_data = {
                    "id": str(uuid.uuid4()),
                    "user_id": user.id,
                    "title": "Document Uploaded",
                    "message": f"Document '{document.original_filename}' uploaded successfully",
                    "type": "success",
                    "timestamp": datetime.utcnow().isoformat(),
                    "persistent": False,
                    "metadata": {
                        "document_id": document.id,
                        "category": document.category,
                        "file_size": document.file_size
                    }
                }
                self.servicebus.send_notification_message(notification_data)
                print(f"Sent upload notification for document {document.id}")
            except Exception as e:
                print(f"Failed to send upload notification: {e}")
            
            return DocumentResponse.from_orm(document)
            
        except Exception as e:
            # Clean up blob if database operation fails
            if 'blob_path' in locals():
                self.blob_service.delete_file(blob_path)
            raise
    
    def get_user_documents(
        self, 
        db: Session, 
        user_id: int,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[DocumentResponse]:
        """Get documents for a user with optional filtering."""
        query = db.query(Document).filter(Document.user_id == user_id)
        
        if category:
            query = query.filter(Document.category == category)
        
        documents = query.order_by(Document.upload_date.desc()).offset(offset).limit(limit).all()
        return [DocumentResponse.from_orm(doc) for doc in documents]
    
    def get_document(self, db: Session, document_id: int, user_id: int) -> Optional[Document]:
        """Get a specific document for a user."""
        return db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
    
    async def delete_document(self, db: Session, document_id: int, user_id: int) -> bool:
        """Delete a document and its file."""
        document = self.get_document(db, document_id, user_id)
        if not document:
            return False
        
        # Delete from Azure Search index via Service Bus
        try:
            await self.servicebus.send_search_indexing_message(
                document_id, 
                user_id, 
                action="delete"
            )
            print(f"Sent document {document_id} to Service Bus for search deletion")
        except Exception as e:
            print(f"Failed to delete from Azure Search: {e}")
        
        # Delete file from Azure Blob Storage
        try:
            self.blob_service.delete_file(document.file_path)
            print(f"Document {document_id} deleted from Azure Blob Storage")
        except Exception as e:
            print(f"Failed to delete from blob storage: {e}")
        
        # Send notification about deletion
        try:
            await self.servicebus.send_notification_message(
                user_id=user_id,
                notification_type="document_deleted",
                message=f"Document '{document.original_filename}' deleted successfully",
                metadata={
                    "document_id": document_id,
                    "category": document.category
                }
            )
            print(f"Sent deletion notification for document {document_id}")
        except Exception as e:
            print(f"Failed to send deletion notification: {e}")
        
        # Delete database record
        db.delete(document)
        db.commit()
        return True