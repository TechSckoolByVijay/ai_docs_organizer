"""
Database models for the document management system.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, BigInteger, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """User model for authentication and document ownership."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationship to documents
    documents = relationship("Document", back_populates="owner")
    search_queries = relationship("SearchQueryLog", back_populates="user")


class Document(Base):
    """Document model for storing file information and metadata."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    category = Column(String(50), nullable=True, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow, index=True)
    file_size = Column(BigInteger, nullable=False)
    content_type = Column(String(100), nullable=False)
    
    # Text extraction and AI fields
    extracted_text = Column(Text, nullable=True)
    detected_intent = Column(String(255), nullable=True)
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    processed_at = Column(DateTime, nullable=True)
    
    # OpenAI generated content
    openai_summary = Column(Text, nullable=True)
    openai_keywords = Column(JSON, nullable=True)  # Store as JSON array
    
    # Search and thumbnails
    content_vector = Column(JSON, nullable=True)  # Store embeddings as JSON
    thumbnail_path = Column(String(500), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="documents")


class SearchQueryLog(Base):
    """Log of user search queries for analytics and improvements."""
    __tablename__ = "search_query_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    query_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    results_count = Column(Integer, default=0)
    search_type = Column(String(20), default="text")  # text, vector, hybrid
    execution_time_ms = Column(Integer, nullable=True)

    # Relationship
    user = relationship("User", back_populates="search_queries")