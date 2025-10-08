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
    from fastapi.responses import StreamingResponse
    import io
    
    try:
        # Get document details
        document = document_service.get_document(db, document_id, current_user.id)
        if not document:
            print(f"Document {document_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        print(f"Attempting to download document {document_id}: {document.original_filename}")
        print(f"File path: {document.file_path}")
        
        # Get file content directly from Azure Blob Storage
        file_content = document_service.blob_service.download_file(document.file_path)
        if not file_content:
            print(f"File content not found for document {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document file not found. Path: {document.file_path}"
            )
        
        print(f"Successfully retrieved {len(file_content)} bytes for document {document_id}")
        
        # Create streaming response
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type='application/octet-stream',
            headers={
                "Content-Disposition": f"attachment; filename=\"{document.original_filename}\"",
                "Content-Length": str(len(file_content))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error downloading document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download document"
        )


@router.get("/{document_id}/thumbnail")
async def get_document_thumbnail(
    document_id: int,
    size: int = Query(960, ge=50, le=1200, description="Thumbnail size in pixels"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a thumbnail preview of a document (for images and PDFs)."""
    from fastapi.responses import StreamingResponse
    from PIL import Image
    import io
    import fitz  # PyMuPDF for PDF processing
    
    try:
        # Get document details
        document = document_service.get_document(db, document_id, current_user.id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check if it's an image or PDF file
        if not document.content_type or not (document.content_type.startswith('image/') or document.content_type == 'application/pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Thumbnail only available for image and PDF files"
            )
        
        # Get file content directly from Azure Blob Storage
        file_content = document_service.blob_service.download_file(document.file_path)
        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document file not found"
            )
        
        # Create thumbnail
        try:
            if document.content_type == 'application/pdf':
                # Handle PDF files
                pdf_document = fitz.open(stream=file_content, filetype="pdf")
                
                if len(pdf_document) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="PDF file is empty"
                    )
                
                # Get the first page
                first_page = pdf_document[0]
                
                # Render page to image (higher DPI for better quality)
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                pix = first_page.get_pixmap(matrix=mat)
                
                # Convert to PIL Image
                img_data = pix.tobytes("ppm")
                image = Image.open(io.BytesIO(img_data))
                
                pdf_document.close()
                
            else:
                # Handle image files
                image = Image.open(io.BytesIO(file_content))
            
            # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create thumbnail while maintaining aspect ratio
            image.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            # Save thumbnail to bytes
            thumbnail_bytes = io.BytesIO()
            image.save(thumbnail_bytes, format='JPEG', quality=85, optimize=True)
            thumbnail_bytes.seek(0)
            
            return StreamingResponse(
                thumbnail_bytes,
                media_type='image/jpeg',
                headers={
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                    "Content-Length": str(len(thumbnail_bytes.getvalue()))
                }
            )
            
        except Exception as e:
            print(f"Error creating thumbnail for document {document_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create thumbnail"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error creating thumbnail for document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get thumbnail"
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