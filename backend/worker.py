#!/usr/bin/env python3
"""
Document Organizer Background Worker Service

This worker processes messages from Azure Service Bus queues:
- Document processing (text extraction, OCR, etc.)
- Search indexing (Azure AI Search indexing)
- Notifications (user notifications)
"""

import os
import sys
import asyncio
import time
import signal
from typing import Dict, Any
from datetime import datetime
import logging

# Add the app directory to the Python path
sys.path.append('/app')

from app.services.azure_servicebus import AzureServiceBusService
from app.database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DocumentWorker:
    """Background worker for processing document-related messages."""
    
    def __init__(self):
        self.running = False
        self.servicebus = None
        self.tasks = []
        
    async def initialize(self):
        """Initialize the worker services."""
        try:
            # Create database tables if they don't exist
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized")
            
            # Initialize Azure Service Bus (REQUIRED)
            self.servicebus = AzureServiceBusService()
            logger.info("Azure Service Bus initialized")
            
            # Test Service Bus connection (REQUIRED)
            connection_test = await self.servicebus.test_connection()
            if connection_test:
                logger.info("Azure Service Bus connection test successful")
            else:
                raise RuntimeError("Azure Service Bus connection test failed - Service Bus is required for worker operation")
                
        except Exception as e:
            logger.error(f"Failed to initialize worker: {e}")
            logger.error("Azure Service Bus is mandatory for worker operation")
            raise
    
    async def start(self):
        """Start the background worker."""
        logger.info("Starting Document Organizer Worker...")
        
        if not self.servicebus:
            await self.initialize()
        
        self.running = True
        
        # Start background tasks for each queue
        self.tasks = [
            asyncio.create_task(self._process_document_processing_queue()),
            asyncio.create_task(self._process_search_indexing_queue()),
            asyncio.create_task(self._process_notifications_queue()),
            asyncio.create_task(self._health_check_task())
        ]
        
        logger.info("Worker started successfully. Processing queues...")
        
        # Wait for all tasks to complete (or be cancelled)
        try:
            await asyncio.gather(*self.tasks)
        except asyncio.CancelledError:
            logger.info("Worker tasks cancelled")
        except Exception as e:
            logger.error(f"Error in worker tasks: {e}")
    
    async def stop(self):
        """Stop the background worker gracefully."""
        logger.info("Stopping Document Organizer Worker...")
        self.running = False
        
        # Cancel all running tasks
        for task in self.tasks:
            if not task.done():
                task.cancel()
        
        # Wait for tasks to complete cancellation
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        
        logger.info("Worker stopped successfully")
    
    async def _process_document_processing_queue(self):
        """Process messages from the document-processing queue."""
        logger.info("Starting document processing queue processor")
        
        while self.running:
            try:
                await self.servicebus.receive_document_processing_messages(max_messages=5)
                await asyncio.sleep(5)  # Wait 5 seconds between polls
            except Exception as e:
                logger.error(f"Error processing document processing queue: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    async def _process_search_indexing_queue(self):
        """Process messages from the search-indexing queue."""
        logger.info("Starting search indexing queue processor")
        
        while self.running:
            try:
                await self.servicebus.receive_search_indexing_messages(max_messages=5)
                await asyncio.sleep(3)  # Wait 3 seconds between polls
            except Exception as e:
                logger.error(f"Error processing search indexing queue: {e}")
                await asyncio.sleep(10)  # Wait longer on error
    
    async def _process_notifications_queue(self):
        """Process messages from the notifications queue."""
        logger.info("Starting notifications queue processor")
        
        while self.running:
            try:
                # TODO: Implement notification processing
                # await self.servicebus.receive_notification_messages(max_messages=5)
                await asyncio.sleep(10)  # Wait 10 seconds between polls
            except Exception as e:
                logger.error(f"Error processing notifications queue: {e}")
                await asyncio.sleep(15)  # Wait longer on error
    
    async def _health_check_task(self):
        """Periodic health check and status logging."""
        logger.info("Starting health check task")
        
        while self.running:
            try:
                # Log worker status every 60 seconds
                await asyncio.sleep(60)
                logger.info(f"Worker health check - Running: {self.running}, Tasks: {len([t for t in self.tasks if not t.done()])}")
                
                # Test Service Bus connection periodically
                if self.servicebus:
                    connection_ok = await self.servicebus.test_connection()
                    if not connection_ok:
                        logger.warning("Service Bus connection test failed during health check")
                        
            except Exception as e:
                logger.error(f"Error in health check: {e}")
                await asyncio.sleep(30)

def signal_handler(worker):
    """Handle shutdown signals gracefully."""
    def handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        asyncio.create_task(worker.stop())
    return handler

async def main():
    """Main worker entry point."""
    logger.info("Document Organizer Worker starting up...")
    
    # Create worker instance
    worker = DocumentWorker()
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler(worker))
    signal.signal(signal.SIGINT, signal_handler(worker))
    
    try:
        # Initialize and start the worker
        await worker.initialize()
        await worker.start()
        
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Fatal error in worker: {e}")
        raise
    finally:
        # Ensure graceful shutdown
        await worker.stop()

if __name__ == "__main__":
    # Check required environment variables
    required_env_vars = [
        "SERVICE_BUS_CONNECTION_STRING",
        "AZURE_SEARCH_ENDPOINT", 
        "AZURE_SEARCH_API_KEY",
        "DATABASE_URL"
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    logger.info("Environment variables validated")
    
    # Run the worker
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker shutdown requested")
    except Exception as e:
        logger.error(f"Worker failed to start: {e}")
        sys.exit(1)
    
    logger.info("Worker shutdown complete")