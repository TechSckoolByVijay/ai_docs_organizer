#!/usr/bin/env python3
"""Reindex all documents to the new Azure Search resource."""

import asyncio
import os
import sys
sys.path.append('/app')

from app.database import SessionLocal
from app.models import Document
from app.services.azure_servicebus import AzureServiceBusService

async def reindex_all_documents():
    """Send all documents to Service Bus for reindexing."""
    print("Starting reindexing process for new Azure Search resource...")
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Get all completed documents
        documents = db.query(Document).filter(
            Document.processing_status == 'completed'
        ).all()
        
        print(f"Found {len(documents)} documents to reindex")
        
        # Initialize Service Bus
        servicebus = AzureServiceBusService()
        
        # Send each document for indexing
        success_count = 0
        failed_count = 0
        
        for doc in documents:
            try:
                print(f"Sending document {doc.id} ({doc.original_filename}) for reindexing...")
                
                success = await servicebus.send_search_indexing_message(
                    document_id=doc.id,
                    user_id=doc.user_id,
                    action="index"
                )
                
                if success:
                    success_count += 1
                    print(f"  ✓ Successfully queued document {doc.id}")
                else:
                    failed_count += 1
                    print(f"  ✗ Failed to queue document {doc.id}")
                    
            except Exception as e:
                failed_count += 1
                print(f"  ✗ Error queuing document {doc.id}: {e}")
        
        print(f"\nReindexing summary:")
        print(f"  Successfully queued: {success_count}")
        print(f"  Failed: {failed_count}")
        print(f"  Total: {len(documents)}")
        
        print(f"\n🔄 Documents are being processed by the worker...")
        print(f"📋 Check worker logs: docker-compose logs worker -f")
        
    except Exception as e:
        print(f"Error during reindexing: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(reindex_all_documents())