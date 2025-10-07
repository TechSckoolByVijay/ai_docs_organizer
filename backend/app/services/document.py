"""
Document service for file handling, upload, and management.
"""
import os
import uuid
import shutil
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
        self.upload_dir = "uploads"
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB default
        self.allowed_extensions = os.getenv("ALLOWED_EXTENSIONS", ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx").split(",")
        self.file_processor = FileProcessingService()
        
        # Initialize Azure services
        try:
            self.blob_service = AzureBlobService()
            self.search_service = AzureSearchService()
            # Try to initialize Service Bus for async processing
            try:
                from app.services.azure_servicebus import AzureServiceBusService
                self.servicebus = AzureServiceBusService()
                print("Azure Service Bus initialized")
            except Exception as e:
                print(f"Azure Service Bus not available: {e}")
                self.servicebus = None
                
            self.use_azure = True
            print("Azure services initialized successfully")
        except Exception as e:
            print(f"Azure services not available, using local storage: {e}")
            self.blob_service = None
            self.search_service = None
            self.servicebus = None
            self.use_azure = False
        
        # Create upload directory if it doesn't exist (fallback)
        os.makedirs(self.upload_dir, exist_ok=True)
    
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
    
    def save_file(self, file: UploadFile, user_id: int) -> str:
        """Save uploaded file to disk and return file path."""
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        filename = f"{file_id}{file_ext}"
        
        # Create user-specific directory
        user_dir = os.path.join(self.upload_dir, f"user_{user_id}")
        os.makedirs(user_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(user_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    
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
            
            # Upload to Azure Blob Storage or local storage
            if self.use_azure and self.blob_service:
                blob_path, file_size = self.blob_service.upload_file(user.id, file)
                file_path = blob_path  # Store blob path instead of local path
            else:
                # Fallback to local storage
                file_path = self.save_file(file, user.id)
                file_size = os.path.getsize(file_path)
            
            # Process file for text extraction (download from blob if needed)
            if self.use_azure and self.blob_service:
                # Download file content for processing
                file_content = self.blob_service.download_file(blob_path)
                if file_content:
                    # Save temporarily for processing
                    temp_path = f"/tmp/{uuid.uuid4()}"
                    with open(temp_path, "wb") as temp_file:
                        temp_file.write(file_content)
                    
                    extracted_text, detected_intent = self.file_processor.extract_text(
                        temp_path, file.content_type or "application/octet-stream"
                    )
                    
                    # Clean up temp file
                    os.remove(temp_path)
                else:
                    extracted_text, detected_intent = "", ""
            else:
                extracted_text, detected_intent = self.file_processor.extract_text(
                    file_path, file.content_type or "application/octet-stream"
                )
            
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
                file_path=file_path,  # This will be blob_path if using Azure
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
            
            # Index to Azure AI Search (or send to Service Bus for async processing)
            print(f"Indexing check: use_azure={self.use_azure}, search_service={self.search_service is not None}, servicebus={self.servicebus is not None}")
            
            if self.use_azure and self.search_service:
                try:
                    if self.servicebus:
                        # Send to Service Bus for asynchronous indexing
                        print(f"Sending document {document.id} to Service Bus for indexing...")
                        await self.servicebus.send_search_indexing_message(
                            document.id, 
                            user.id, 
                            action="index"
                        )
                        print(f"Successfully sent document {document.id} to Service Bus for indexing")
                    else:
                        # Direct synchronous indexing
                        print(f"Using direct indexing for document {document.id}")
                        self.search_service.index_document(document, file_path)
                        print(f"Document {document.id} indexed to Azure Search")
                except Exception as e:
                    print(f"Failed to index document: {e}")
            else:
                print(f"Skipping indexing - conditions not met")
            
            # Send notification about successful upload
            if self.use_azure and self.servicebus:
                try:
                    await self.servicebus.send_notification_message(
                        user_id=user.id,
                        notification_type="document_uploaded",
                        message=f"Document '{document.original_filename}' uploaded successfully",
                        metadata={
                            "document_id": document.id,
                            "category": document.category,
                            "file_size": document.file_size
                        }
                    )
                    print(f"Sent upload notification for document {document.id}")
                except Exception as e:
                    print(f"Failed to send upload notification: {e}")
            
            return DocumentResponse.from_orm(document)
            
        except Exception as e:
            # Clean up file if database operation fails
            if self.use_azure and self.blob_service and 'blob_path' in locals():
                self.blob_service.delete_file(blob_path)
            elif 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
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
        
        # Delete from Azure Search index (or send to Service Bus)
        if self.use_azure and self.search_service:
            try:
                if self.servicebus:
                    # Send to Service Bus for asynchronous deletion
                    await self.servicebus.send_search_indexing_message(
                        document_id, 
                        user_id, 
                        action="delete"
                    )
                    print(f"Sent document {document_id} to Service Bus for search deletion")
                else:
                    # Direct synchronous deletion
                    self.search_service.delete_document(str(document_id))
            except Exception as e:
                print(f"Failed to delete from Azure Search: {e}")
        
        # Delete file from Azure Blob Storage or local storage
        if self.use_azure and self.blob_service:
            try:
                self.blob_service.delete_file(document.file_path)
            except Exception as e:
                print(f"Failed to delete from blob storage: {e}")
        else:
            # Delete local file
            if os.path.exists(document.file_path):
                os.remove(document.file_path)
        
        # Delete thumbnail if exists (local only for now)
        if document.thumbnail_path and os.path.exists(document.thumbnail_path):
            os.remove(document.thumbnail_path)
        
        # Send notification about deletion
        if self.use_azure and self.servicebus:
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
            except Exception as e:
                print(f"Failed to send deletion notification: {e}")
        
        # Delete database record
        db.delete(document)
        db.commit()
        return True
    
    def get_file_path(self, db: Session, document_id: int, user_id: int) -> Optional[str]:
        """Get file path for downloading."""
        document = self.get_document(db, document_id, user_id)
        if not document:
            return None
        
        if self.use_azure and self.blob_service:
            # Return Azure Blob Storage file content
            return document.file_path  # This is the blob path
        else:
            # Return local file path
            if os.path.exists(document.file_path):
                return document.file_path
        return None
    
    def get_file_content(self, db: Session, document_id: int, user_id: int) -> Optional[bytes]:
        """Get file content for downloading."""
        document = self.get_document(db, document_id, user_id)
        if not document:
            return None
        
        try:
            # First try Azure Blob Storage if available
            if self.use_azure and self.blob_service:
                content = self.blob_service.download_file(document.file_path)
                if content:
                    return content
                else:
                    print(f"Blob not found, trying local fallback: {document.file_path}")
            
            # Fallback to local file (or if Azure is not configured)
            if os.path.exists(document.file_path):
                with open(document.file_path, 'rb') as f:
                    return f.read()
            
            # Try alternative local paths
            alternative_paths = [
                os.path.join(self.upload_dir, f"user_{user_id}", os.path.basename(document.file_path)),
                os.path.join(self.upload_dir, os.path.basename(document.file_path)),
                document.file_path
            ]
            
            for path in alternative_paths:
                if os.path.exists(path):
                    print(f"Found file at alternative path: {path}")
                    with open(path, 'rb') as f:
                        return f.read()
                        
            print(f"File not found in any location for document {document_id}")
            return None
            
        except Exception as e:
            print(f"Error retrieving file content for document {document_id}: {e}")
            return None