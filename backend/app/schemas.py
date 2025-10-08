"""
Pydantic schemas for request/response models.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Document schemas
class DocumentBase(BaseModel):
    original_filename: str
    category: Optional[str] = None


class DocumentCreate(DocumentBase):
    file_size: int
    content_type: str
    file_path: str


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    upload_date: datetime
    file_size: int
    content_type: str
    processing_status: str
    processed_at: Optional[datetime] = None
    extracted_text: Optional[str] = None
    detected_intent: Optional[str] = None
    openai_summary: Optional[str] = None
    openai_keywords: Optional[List[str]] = None
    thumbnail_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Search metadata (populated during search operations)
    search_score: Optional[float] = None
    search_caption: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    category: Optional[str] = None
    extracted_text: Optional[str] = None
    detected_intent: Optional[str] = None
    processing_status: Optional[str] = None
    openai_summary: Optional[str] = None
    openai_keywords: Optional[List[str]] = None


# Batch upload schemas
class BatchUploadFileStatus(BaseModel):
    filename: str
    status: str  # "success", "error", "pending", "processing"
    document_id: Optional[int] = None
    error_message: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None


class BatchUploadResponse(BaseModel):
    total_files: int
    successful_uploads: int
    failed_uploads: int
    files: List[BatchUploadFileStatus]
    message: str


class BatchUploadProgress(BaseModel):
    total_files: int
    processed_files: int
    current_file: Optional[str] = None
    status: str  # "processing", "completed", "error"
    files: List[BatchUploadFileStatus]


# Search schemas
class SearchQuery(BaseModel):
    query: str
    category: Optional[str] = None
    limit: Optional[int] = 20
    offset: Optional[int] = 0


class SearchResult(BaseModel):
    documents: List[DocumentResponse]
    total: int
    query: str
    execution_time_ms: Optional[int] = None


class SearchQueryLogResponse(BaseModel):
    id: int
    query_text: str
    timestamp: datetime
    results_count: int
    search_type: str
    execution_time_ms: Optional[int] = None

    class Config:
        from_attributes = True


# Category schema
class CategoryResponse(BaseModel):
    name: str
    display_name: str
    description: str


# API Response schemas
class APIResponse(BaseModel):
    status: str
    message: str
    data: Optional[dict] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    database_status: str