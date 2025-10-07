"""
Documents router for file upload, management, and retrieval.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DocumentResponse, APIResponse, CategoryResponse
from app.services.document import DocumentService
from app.services.category import CategoryService
from app.services.file_processing import FileProcessingService
from app.routers.auth import get_current_user

router = APIRouter()
document_service = DocumentService()
file_processor = FileProcessingService()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload a new document."""
    try:
        document = await document_service.upload_document(
            db=db,
            user=current_user,
            file=file,
            category=category
        )
        return document
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100, description="Number of documents to return"),
    offset: int = Query(0, ge=0, description="Number of documents to skip"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List user documents with optional filtering."""
    documents = document_service.get_user_documents(
        db=db,
        user_id=current_user.id,
        category=category,
        limit=limit,
        offset=offset
    )
    return documents


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all available document categories."""
    return CategoryService.get_categories()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get details of a specific document."""
    document = document_service.get_document(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return DocumentResponse.from_orm(document)


@router.delete("/{document_id}", response_model=APIResponse)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document."""
    try:
        success = await document_service.delete_document(
            db=db,
            document_id=document_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return APIResponse(
            status="success",
            message="Document deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )


@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Download a document file."""
    file_path = document_service.get_file_path(db, document_id, current_user.id)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found"
        )
    
    # Get document details for filename
    document = document_service.get_document(db, document_id, current_user.id)
    filename = document.original_filename if document else "document"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )


@router.delete("/{document_id}", response_model=APIResponse)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a document."""
    success = document_service.delete_document(db, document_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return APIResponse(
        status="success",
        message="Document deleted successfully"
    )


@router.post("/process-pending", response_model=APIResponse)
async def process_pending_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Process all pending documents for the current user."""
    from datetime import datetime
    from app.models import Document
    
    try:
        # Get all pending documents for the user
        pending_docs = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.processing_status == "pending"
        ).all()
        
        processed_count = 0
        
        for doc in pending_docs:
            try:
                # Extract text from the document
                extracted_text, detected_intent = file_processor.extract_text(
                    doc.file_path, doc.content_type
                )
                
                # Re-categorize with extracted text
                auto_category, confidence, keywords = CategoryService.auto_categorize(
                    filename=doc.original_filename,
                    extracted_text=extracted_text
                )
                
                # Update document with processed data
                doc.extracted_text = extracted_text
                doc.detected_intent = detected_intent
                doc.category = auto_category  # Update category with better info
                doc.processing_status = "completed"
                doc.processed_at = datetime.utcnow()
                
                processed_count += 1
                
            except Exception as e:
                print(f"Error processing document {doc.id}: {str(e)}")
                doc.processing_status = "failed"
        
        db.commit()
        
        return APIResponse(
            status="success",
            message=f"Processed {processed_count} documents",
            data={"processed_count": processed_count}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process pending documents"
        )