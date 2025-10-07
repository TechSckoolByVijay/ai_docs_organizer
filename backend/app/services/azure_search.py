"""
Azure AI Search service for vector-based document search and indexing.
"""
import os
import json
import requests
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential
import openai
from app.models import Document


class AzureSearchService:
    """Service for Azure AI Search operations."""
    
    def __init__(self):
        self.search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        self.search_key = os.getenv("AZURE_SEARCH_API_KEY")
        self.index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "documents-index")
        self.min_score = float(os.getenv("AZURE_SEARCH_MIN_SCORE", "0.5"))
        self.embedding_model = "text-embedding-ada-002"
        
        if not self.search_endpoint or not self.search_key:
            raise ValueError("Azure Search endpoint and key must be configured")
        
        self.search_client = SearchClient(
            endpoint=self.search_endpoint,
            index_name=self.index_name,
            credential=AzureKeyCredential(self.search_key)
        )
        
        # Configure OpenAI for embeddings
        openai.api_key = os.getenv("OPENAI_API_KEY")
    
    def create_embedding(self, text: str) -> List[float]:
        """Create vector embedding for text using OpenAI."""
        try:
            response = openai.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error creating embedding: {e}")
            return []
    
    def prepare_document_for_index(self, document: Document, blob_path: str) -> Dict:
        """Prepare a document for Azure Search indexing."""
        # Combine text for embedding
        combined_text = " ".join(filter(None, [
            document.original_filename,
            document.extracted_text or "",
            document.openai_summary or "",
            document.category or "",
            document.detected_intent or ""
        ]))
        
        # Create embedding
        content_vector = self.create_embedding(combined_text) if combined_text.strip() else []
        
        # Prepare keywords as list
        keywords = []
        if document.openai_keywords:
            if isinstance(document.openai_keywords, list):
                keywords = document.openai_keywords
            elif isinstance(document.openai_keywords, str):
                try:
                    keywords = json.loads(document.openai_keywords)
                except:
                    keywords = [document.openai_keywords]
        
        search_doc = {
            "document_id": str(document.id),
            "user_id": document.user_id,
            "original_filename": document.original_filename,
            "category": document.category or "other",
            "content_type": document.content_type,
            "extracted_text": document.extracted_text or "",
            "detected_intent": document.detected_intent or "",
            "openai_summary": document.openai_summary or "",
            "openai_keywords": keywords,
            "upload_date": document.upload_date.isoformat() + "Z" if document.upload_date else datetime.utcnow().isoformat() + "Z",
            "file_size": document.file_size,
            "blob_path": blob_path,
            "content_vector": content_vector
        }
        
        return search_doc
    
    def index_document(self, document: Document, blob_path: str) -> bool:
        """Index a single document to Azure Search."""
        try:
            search_doc = self.prepare_document_for_index(document, blob_path)
            result = self.search_client.upload_documents([search_doc])
            return len(result) > 0 and result[0].succeeded
        except Exception as e:
            print(f"Error indexing document {document.id}: {e}")
            return False
    
    async def test_connection(self) -> bool:
        """Test connection to Azure Search service."""
        try:
            # Try to get the search index
            from azure.search.documents.indexes import SearchIndexClient
            index_client = SearchIndexClient(
                endpoint=self.search_endpoint,
                credential=AzureKeyCredential(self.search_key)
            )
            index = index_client.get_index(self.index_name)
            return index is not None
        except Exception as e:
            print(f"Azure Search connection test failed: {e}")
            return False
    
    async def get_index_stats(self) -> dict:
        """Get statistics about the search index."""
        try:
            from azure.search.documents.indexes import SearchIndexClient
            index_client = SearchIndexClient(
                endpoint=self.search_endpoint,
                credential=AzureKeyCredential(self.search_key)
            )
            
            # Use the correct method name for getting index statistics
            stats = index_client.get_search_index_statistics(self.index_name)
            return {
                "document_count": stats.document_count,
                "storage_size": stats.storage_size
            }
        except Exception as e:
            print(f"Failed to get index stats: {e}")
            return {"document_count": 0, "storage_size": 0}
    
    def delete_document(self, document_id: str) -> bool:
        """Delete a document from Azure Search index."""
        try:
            result = self.search_client.delete_documents([{"document_id": document_id}])
            return len(result) > 0 and result[0].succeeded
        except Exception as e:
            print(f"Error deleting document {document_id}: {e}")
            return False
    
    def search_documents(
        self,
        user_id: int,
        query: str,
        category: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Dict], int]:
        """
        Search documents using Azure AI Search with semantic search capabilities.
        Based on the working notebook implementation.
        """
        try:
            # Prepare headers for REST API call (like in notebook)
            headers = {
                "Content-Type": "application/json",
                "api-key": self.search_key
            }
            
            print(f"🔍 Searching: '{query}' for user {user_id}")
            
            # Construct search URL
            url = f"{self.search_endpoint}/indexes/{self.index_name}/docs/search?api-version=2023-11-01"
            
            # Build filter expression
            filter_expr = f"user_id eq {user_id}"
            if category:
                filter_expr += f" and category eq '{category}'"
            
            # Prepare payload with semantic search configuration (like in notebook)
            payload = {
                "search": query,
                "queryType": "semantic",
                "semanticConfiguration": "semantic-config",
                "top": limit + offset,  # Get more results to handle offset
                "filter": filter_expr,
                "captions": "extractive",
                "answers": "extractive|count-3"
            }
            
            # Make the API call
            response = requests.post(url, headers=headers, json=payload)
            
            # Fallback if semantic-config missing (like in notebook)
            if response.status_code == 400 and "Unknown semantic configuration" in response.text:
                print("⚠️ Semantic config not found — retrying with simple search mode...")
                payload.pop("semanticConfiguration", None)
                payload["queryType"] = "simple"
                response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("value", [])
                
                # Filter results by minimum score (like in notebook)
                filtered_results = [r for r in results if r.get("@search.score", 0) >= self.min_score]
                
                # Apply offset after filtering
                if offset > 0:
                    filtered_results = filtered_results[offset:]
                if limit > 0:
                    filtered_results = filtered_results[:limit]
                
                # Format results for UI display
                formatted_results = []
                for doc in filtered_results:
                    formatted_doc = {
                        "document_id": doc.get("document_id", "N/A"),
                        "user_id": doc.get("user_id", "N/A"),
                        "original_filename": doc.get("original_filename", ""),
                        "category": doc.get("category", ""),
                        "content_type": doc.get("content_type", ""),
                        "extracted_text": doc.get("extracted_text", ""),
                        "openai_summary": doc.get("openai_summary", ""),
                        "search_score": round(doc.get("@search.score", 0), 3),
                        "search_caption": "",
                        "upload_date": doc.get("upload_date", ""),
                        "file_size": doc.get("file_size", 0)
                    }
                    
                    # Extract caption if available (like in notebook)
                    if "@search.captions" in doc and doc["@search.captions"]:
                        caption = doc["@search.captions"][0].get("text", "")
                        formatted_doc["search_caption"] = caption
                    
                    formatted_results.append(formatted_doc)
                
                total_count = len(filtered_results)
                
                print(f"✅ Found {total_count} results above score {self.min_score}")
                return formatted_results, total_count
                
            else:
                print(f"❌ Search Error: {response.status_code} - {response.text}")
                return [], 0
            
        except Exception as e:
            print(f"Search error: {e}")
            return [], 0
    
    def suggest_terms(self, query: str, user_id: int) -> List[str]:
        """Get search suggestions using Azure Search suggester."""
        try:
            results = self.search_client.suggest(
                search_text=query,
                suggester_name="document-suggester",
                filter=f"user_id eq {user_id}",
                top=5
            )
            
            suggestions = []
            for result in results:
                if result.get('text'):
                    suggestions.append(result['text'])
            
            return suggestions
            
        except Exception as e:
            print(f"Error getting suggestions: {e}")
            return []
    
    def reindex_all_documents(self, documents: List[Tuple[Document, str]]) -> Dict[str, int]:
        """Reindex all documents in batch."""
        try:
            search_docs = []
            for document, blob_path in documents:
                search_doc = self.prepare_document_for_index(document, blob_path)
                search_docs.append(search_doc)
            
            # Process in batches of 100
            batch_size = 100
            total_indexed = 0
            total_failed = 0
            
            for i in range(0, len(search_docs), batch_size):
                batch = search_docs[i:i + batch_size]
                
                try:
                    results = self.search_client.upload_documents(batch)
                    
                    for result in results:
                        if result.succeeded:
                            total_indexed += 1
                        else:
                            total_failed += 1
                            print(f"Failed to index document: {result.key}, Error: {result.error_message}")
                            
                except Exception as e:
                    print(f"Error indexing batch: {e}")
                    total_failed += len(batch)
            
            return {
                "total_documents": len(search_docs),
                "indexed": total_indexed,
                "failed": total_failed
            }
            
        except Exception as e:
            print(f"Error reindexing documents: {e}")
            return {"total_documents": 0, "indexed": 0, "failed": 0}
