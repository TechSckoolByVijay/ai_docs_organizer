"""
Search router for document search functionality.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SearchQueryLog
from app.schemas import SearchQuery, SearchResult, DocumentResponse, SearchQueryLogResponse, APIResponse
from app.services.search import SearchService
from app.routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=SearchResult)
async def search_documents(
    search_request: SearchQuery,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Search user documents."""
    try:
        # Perform search
        documents, total, execution_time = SearchService.search_documents(
            db=db,
            user_id=current_user.id,
            query=search_request.query,
            category=search_request.category,
            limit=search_request.limit or 20,
            offset=search_request.offset or 0
        )
        
        # Convert to response models
        document_responses = [DocumentResponse.from_orm(doc) for doc in documents]
        
        # Log the search query
        SearchService.log_search_query(
            db=db,
            user_id=current_user.id,
            query=search_request.query,
            results_count=total,
            execution_time_ms=execution_time,
            search_type="text"
        )
        
        return SearchResult(
            documents=document_responses,
            total=total,
            query=search_request.query,
            execution_time_ms=int(execution_time)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.get("/history", response_model=List[SearchQueryLogResponse])
async def get_search_history(
    limit: int = Query(10, ge=1, le=50, description="Number of recent searches to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user's search history."""
    try:
        search_history = SearchService.get_search_history(
            db=db,
            user_id=current_user.id,
            limit=limit
        )
        
        return [SearchQueryLogResponse.from_orm(log) for log in search_history]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve search history"
        )


@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial query to get suggestions for")
):
    """Get search suggestions based on input."""
    try:
        suggestions = SearchService.suggest_search_terms(q)
        
        return {
            "query": q,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestions"
        )


@router.get("/popular")
async def get_popular_searches(
    limit: int = Query(10, ge=1, le=20, description="Number of popular searches to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Require authentication but don't use user data
):
    """Get popular search queries (anonymized)."""
    try:
        popular_searches = SearchService.get_popular_searches(
            db=db,
            limit=limit
        )
        
        return {
            "popular_searches": popular_searches
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get popular searches"
        )


@router.delete("/history", response_model=APIResponse)
async def clear_search_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Clear user's search history."""
    try:
        # Delete all search history for the user
        db.query(SearchQueryLog).filter(SearchQueryLog.user_id == current_user.id).delete()
        db.commit()
        
        return APIResponse(
            status="success",
            message="Search history cleared successfully"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear search history"
        )