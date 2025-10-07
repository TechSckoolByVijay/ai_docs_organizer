"""
Azure services testing router for checking connectivity and configuration.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/api/azure", tags=["Azure Services"])


@router.get("/test-connectivity", response_model=Dict[str, Any])
async def test_azure_connectivity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Test connectivity to Azure services.
    
    Returns status of each Azure service configuration.
    """
    results = {
        "user_id": current_user.id,
        "timestamp": "2024-01-01T00:00:00Z",
        "azure_search": {"status": "not_configured", "details": ""},
        "azure_blob": {"status": "not_configured", "details": ""},
        "azure_servicebus": {"status": "not_configured", "details": ""},
        "openai": {"status": "not_configured", "details": ""},
        "overall_status": "fallback_mode"
    }
    
    # Test Azure Search Service
    try:
        from app.services.azure_search import AzureSearchService
        azure_search = AzureSearchService()
        
        # Try to get service info
        await azure_search.test_connection()
        results["azure_search"] = {
            "status": "connected",
            "details": f"Connected to {azure_search.search_client.endpoint}",
            "index_name": azure_search.index_name
        }
    except Exception as e:
        results["azure_search"] = {
            "status": "error",
            "details": f"Connection failed: {str(e)}"
        }
    
    # Test Azure Blob Storage
    try:
        from app.services.azure_blob import AzureBlobService
        azure_blob = AzureBlobService()
        
        # Try to test blob service
        test_result = await azure_blob.test_connection()
        if test_result:
            results["azure_blob"] = {
                "status": "connected",
                "details": f"Connected to storage account",
                "container_name": azure_blob.container_name
            }
        else:
            results["azure_blob"] = {
                "status": "error",
                "details": "Connection test failed"
            }
    except Exception as e:
        results["azure_blob"] = {
            "status": "error",
            "details": f"Connection failed: {str(e)}"
        }
    
    # Test Azure Service Bus
    try:
        from app.services.azure_servicebus import AzureServiceBusService
        azure_servicebus = AzureServiceBusService()
        
        # Try to test service bus connection
        test_result = await azure_servicebus.test_connection()
        if test_result:
            results["azure_servicebus"] = {
                "status": "connected",
                "details": "Connected to Service Bus",
                "queues": [
                    azure_servicebus.document_processing_queue,
                    azure_servicebus.search_indexing_queue,
                    azure_servicebus.notifications_queue
                ]
            }
        else:
            results["azure_servicebus"] = {
                "status": "error",
                "details": "Connection test failed"
            }
    except Exception as e:
        results["azure_servicebus"] = {
            "status": "error",
            "details": f"Connection failed: {str(e)}"
        }
    
    # Test OpenAI API
    try:
        from app.services.azure_search import AzureSearchService
        azure_search = AzureSearchService()
        
        # Try to create a test embedding
        test_embedding = azure_search.create_embedding("test")
        if test_embedding and len(test_embedding) > 0:
            results["openai"] = {
                "status": "connected",
                "details": f"Embedding model working, dimension: {len(test_embedding)}",
                "model": azure_search.embedding_model
            }
        else:
            results["openai"] = {
                "status": "error", 
                "details": "Failed to create test embedding"
            }
    except Exception as e:
        results["openai"] = {
            "status": "error",
            "details": f"API call failed: {str(e)}"
        }
    
    # Determine overall status
    connected_services = sum(1 for service in [results["azure_search"], results["azure_blob"], results["azure_servicebus"], results["openai"]] 
                           if service["status"] == "connected")
    
    if connected_services == 4:
        results["overall_status"] = "fully_connected"
    elif connected_services > 0:
        results["overall_status"] = "partially_connected"
    else:
        results["overall_status"] = "fallback_mode"
    
    return results


@router.post("/reindex-documents")
async def reindex_all_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reindex all user's documents in Azure Search.
    
    Useful for migration or when search index needs to be rebuilt.
    """
    try:
        from app.services.azure_search import AzureSearchService
        azure_search = AzureSearchService()
        
        # Get user's documents from database
        from app.models import Document
        documents = db.query(Document).filter(Document.user_id == current_user.id).all()
        
        if not documents:
            return {
                "status": "success",
                "message": "No documents to reindex",
                "indexed_count": 0
            }
        
        # Prepare documents for reindexing with blob paths
        document_tuples = []
        for doc in documents:
            # Generate blob path for each document
            blob_path = f"user_{current_user.id}/{doc.original_filename}"
            document_tuples.append((doc, blob_path))
        
        # Reindex all documents
        result = azure_search.reindex_all_documents(document_tuples)
        
        return {
            "status": "success",
            "message": f"Reindexed {result['indexed']} documents successfully",
            "total_documents": result['total_documents'],
            "indexed_count": result['indexed'],
            "failed_count": result['failed']
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reindex documents: {str(e)}"
        )


@router.post("/setup-service-bus-queues")
async def setup_service_bus_queues(
    current_user: User = Depends(get_current_user)
):
    """
    Create required Service Bus queues if they don't exist.
    """
    try:
        from app.services.azure_servicebus import AzureServiceBusService
        servicebus = AzureServiceBusService()
        
        # Create queues
        results = await servicebus.ensure_queues_exist()
        
        success_count = sum(1 for success in results.values() if success)
        total_queues = len(results)
        
        return {
            "status": "success" if success_count == total_queues else "partial",
            "message": f"Queue setup completed: {success_count}/{total_queues} queues ready",
            "queues": results,
            "details": {
                "document_processing": results.get("document-processing", False),
                "search_indexing": results.get("search-indexing", False),
                "notifications": results.get("notifications", False)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to setup Service Bus queues: {str(e)}"
        )


@router.get("/search-index-stats")
async def get_search_index_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics about the Azure Search index.
    """
    try:
        from app.services.azure_search import AzureSearchService
        azure_search = AzureSearchService()
        
        # Get index statistics
        stats = await azure_search.get_index_stats()
        
        return {
            "status": "success",
            "index_name": azure_search.index_name,
            "stats": stats,
            "user_id": current_user.id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get index statistics: {str(e)}"
        )