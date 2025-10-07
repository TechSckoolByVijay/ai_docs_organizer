"""
Search service for document searching and query logging.
"""
import time
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models import Document, SearchQueryLog, User
from app.schemas import SearchResult, DocumentResponse


"""
Search service for document searching and query logging.
"""
import time
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models import Document, SearchQueryLog, User
from app.schemas import SearchResult, DocumentResponse


class SearchService:
    """Service for document search functionality."""
    
    def __init__(self):
        # Try to initialize Azure Search
        try:
            from app.services.azure_search import AzureSearchService
            self.azure_search = AzureSearchService()
            self.use_azure = True
            print("Azure Search service initialized")
        except Exception as e:
            print(f"Azure Search not available, using local search: {e}")
            self.azure_search = None
            self.use_azure = False
    
    @staticmethod
    def search_documents(
        db: Session,
        user_id: int,
        query: str,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Document], int, float]:
        """
        Search documents for a user using Azure AI Search with semantic capabilities.
        
        Args:
            db: Database session
            user_id: User ID to search documents for
            query: Search query string
            category: Optional category filter
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            Tuple of (documents, total_count, execution_time_ms)
        """
        start_time = time.time()
        
        # Try Azure Search first
        search_service = SearchService()
        if search_service.use_azure and search_service.azure_search:
            try:
                search_results, total = search_service.azure_search.search_documents(
                    user_id=user_id,
                    query=query,
                    category=category,
                    limit=limit,
                    offset=offset
                )
                
                # Convert Azure Search results to Document objects
                documents = []
                if search_results:
                    # Get document IDs from search results
                    doc_ids = []
                    for result in search_results:
                        try:
                            doc_id = int(result['document_id'])
                            doc_ids.append(doc_id)
                        except (ValueError, KeyError):
                            continue
                    
                    # Fetch actual Document objects from database
                    if doc_ids:
                        db_documents = db.query(Document).filter(
                            Document.id.in_(doc_ids),
                            Document.user_id == user_id
                        ).all()
                        
                        # Create document dict for quick lookup
                        doc_dict = {doc.id: doc for doc in db_documents}
                        
                        # Order documents according to search results and add search metadata
                        for result in search_results:
                            try:
                                doc_id = int(result['document_id'])
                                if doc_id in doc_dict:
                                    doc = doc_dict[doc_id]
                                    # Add search metadata to document
                                    doc.search_score = result.get('search_score', 0)
                                    doc.search_caption = result.get('search_caption', '')
                                    documents.append(doc)
                            except (ValueError, KeyError):
                                continue
                
                execution_time = (time.time() - start_time) * 1000
                print(f"✅ Azure Search completed: {len(documents)} docs in {execution_time:.1f}ms")
                return documents, total, execution_time
                
            except Exception as e:
                print(f"Azure Search failed, falling back to local search: {e}")
        
        # Fallback to enhanced local search
        return SearchService._local_search_documents(
            db, user_id, query, category, limit, offset, start_time
        )
    
    @staticmethod
    def _local_search_documents(
        db: Session,
        user_id: int,
        query: str,
        category: Optional[str],
        limit: int,
        offset: int,
        start_time: float
    ) -> Tuple[List[Document], int, float]:
        """Enhanced local search with synonym mapping and fuzzy matching."""
        
        # Build base query
        base_query = db.query(Document).filter(Document.user_id == user_id)
        
        # Add category filter if specified
        if category:
            base_query = base_query.filter(Document.category == category)
        
        # Split query into terms for better matching
        query_terms = query.lower().strip().split()
        
        # Enhanced synonym mapping for better search results
        synonym_map = {
            'health': ['medical', 'doctor', 'clinic', 'hospital', 'prescription'],
            'medical': ['health', 'doctor', 'physician', 'clinic', 'hospital'],
            'bill': ['invoice', 'receipt', 'statement', 'charge'],
            'bills': ['invoices', 'receipts', 'statements', 'charges'],
            'receipt': ['bill', 'invoice', 'purchase'],
            'document': ['file', 'paper', 'record'],
            'related': ['related', 'reated'],  # Handle common typo
        }
        
        # Expand query terms with synonyms
        expanded_terms = []
        for term in query_terms:
            expanded_terms.append(term)
            if term in synonym_map:
                expanded_terms.extend(synonym_map[term])
        
        # Remove duplicates while preserving order
        query_terms = list(dict.fromkeys(expanded_terms))
        
        if not query_terms:
            # If no query terms, just return recent documents
            documents = base_query.order_by(Document.upload_date.desc()).offset(offset).limit(limit).all()
            total = base_query.count()
        else:
            # Build search conditions with enhanced matching
            search_conditions = []
            
            for term in query_terms:
                term_conditions = [
                    # Exact and partial matches in filename
                    Document.original_filename.ilike(f'%{term}%'),
                    # Full text search in extracted content  
                    Document.extracted_text.ilike(f'%{term}%'),
                    # Category matching
                    Document.category.ilike(f'%{term}%'),
                    # Intent matching
                    Document.detected_intent.ilike(f'%{term}%'),
                    # Summary matching (if available)
                    Document.openai_summary.ilike(f'%{term}%')
                ]
                
                # Add partial word matching for terms longer than 3 chars
                if len(term) > 3:
                    # Match if term is contained within words (handles typos)
                    partial_conditions = [
                        Document.original_filename.ilike(f'%{term[:-1]}%'),  # Remove last char
                        Document.extracted_text.ilike(f'%{term[:-1]}%'),
                        Document.category.ilike(f'%{term[:-1]}%')
                    ]
                    term_conditions.extend(partial_conditions)
                
                search_conditions.append(or_(*term_conditions))
            
            # Use OR logic instead of AND for more flexible matching
            # At least one term should match for broader results
            if search_conditions:
                search_query = base_query.filter(or_(*search_conditions))
            else:
                search_query = base_query
            
            # Get total count
            total = search_query.count()
            
            # Get paginated results with relevance-based ordering
            documents = (search_query
                        .order_by(
                            # Prioritize exact matches in filename
                            Document.original_filename.ilike(f'%{query.lower()}%').desc(),
                            # Then category matches
                            Document.category.ilike(f'%{query_terms[0]}%').desc(),
                            # Finally by upload date
                            Document.upload_date.desc()
                        )
                        .offset(offset)
                        .limit(limit)
                        .all())
        
        execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return documents, total, execution_time
    
    @staticmethod
    def log_search_query(
        db: Session,
        user_id: int,
        query: str,
        results_count: int,
        execution_time_ms: float,
        search_type: str = "text"
    ) -> SearchQueryLog:
        """Log a search query for analytics."""
        search_log = SearchQueryLog(
            user_id=user_id,
            query_text=query,
            results_count=results_count,
            execution_time_ms=int(execution_time_ms),
            search_type=search_type
        )
        
        db.add(search_log)
        db.commit()
        db.refresh(search_log)
        
        return search_log
    
    @staticmethod
    def get_search_history(
        db: Session,
        user_id: int,
        limit: int = 10
    ) -> List[SearchQueryLog]:
        """Get recent search history for a user."""
        return (db.query(SearchQueryLog)
                .filter(SearchQueryLog.user_id == user_id)
                .order_by(SearchQueryLog.timestamp.desc())
                .limit(limit)
                .all())
    
    @staticmethod
    def get_popular_searches(
        db: Session,
        limit: int = 10
    ) -> List[dict]:
        """Get popular search queries across all users (anonymized)."""
        # Group by query text and count occurrences
        popular_queries = (
            db.query(
                SearchQueryLog.query_text,
                func.count(SearchQueryLog.id).label('count'),
                func.avg(SearchQueryLog.execution_time_ms).label('avg_time')
            )
            .group_by(SearchQueryLog.query_text)
            .order_by(func.count(SearchQueryLog.id).desc())
            .limit(limit)
            .all()
        )
        
        return [
            {
                'query': query,
                'count': count,
                'avg_execution_time_ms': round(avg_time, 2) if avg_time else 0
            }
            for query, count, avg_time in popular_queries
        ]
    
    @staticmethod
    def suggest_search_terms(query: str) -> List[str]:
        """Suggest search terms based on common document types and categories."""
        common_terms = [
            'receipt', 'invoice', 'bill', 'medical', 'prescription', 'insurance',
            'tax', 'document', 'statement', 'warranty', 'manual', 'contract',
            'legal', 'employment', 'payroll', 'bank', 'financial', 'utility',
            'government', 'business', 'travel', 'education', 'personal'
        ]
        
        query_lower = query.lower()
        suggestions = []
        
        for term in common_terms:
            if query_lower in term or term.startswith(query_lower):
                suggestions.append(term)
        
        # Add some time-based suggestions
        time_suggestions = [
            'last month', 'this year', '2023', '2024', 'recent', 'old'
        ]
        
        for term in time_suggestions:
            if query_lower in term:
                suggestions.append(term)
        
        return suggestions[:5]  # Return top 5 suggestions