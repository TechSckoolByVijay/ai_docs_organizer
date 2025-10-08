"""
Azure Service Bus service for document processing messaging.
"""
import os
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from azure.servicebus.exceptions import ServiceBusError
from azure.servicebus.management import ServiceBusAdministrationClient


class AzureServiceBusService:
    """Service for Azure Service Bus messaging."""
    
    def __init__(self):
        """Initialize Azure Service Bus client."""
        self.connection_string = os.getenv("SERVICE_BUS_CONNECTION_STRING")
        
        if not self.connection_string:
            raise ValueError("Azure Service Bus connection string must be configured")
        
        self.client = ServiceBusClient.from_connection_string(self.connection_string)
        self.admin_client = ServiceBusAdministrationClient.from_connection_string(self.connection_string)
        
        # Queue names for different types of processing
        self.document_processing_queue = "document-processing"
        self.search_indexing_queue = "search-indexing"
        self.notifications_queue = "notifications"
    
    async def ensure_queues_exist(self) -> Dict[str, bool]:
        """Ensure all required queues exist, create them if they don't."""
        queues_to_create = [
            self.document_processing_queue,
            self.search_indexing_queue,
            self.notifications_queue
        ]
        
        results = {}
        
        for queue_name in queues_to_create:
            try:
                # Check if queue exists
                if self.admin_client.get_queue(queue_name):
                    results[queue_name] = True
                    print(f"Queue '{queue_name}' already exists")
            except Exception:
                # Queue doesn't exist, try to create it
                try:
                    from azure.servicebus.management import QueueProperties
                    from datetime import timedelta
                    queue_properties = QueueProperties(
                        name=queue_name,
                        max_delivery_count=10,
                        default_message_time_to_live=timedelta(days=14),
                        lock_duration=timedelta(minutes=5)
                    )
                    self.admin_client.create_queue(queue_properties)
                    results[queue_name] = True
                    print(f"Successfully created queue '{queue_name}'")
                except Exception as e:
                    results[queue_name] = False
                    print(f"Failed to create queue '{queue_name}': {e}")
        
        return results
    
    async def send_document_processing_message(
        self, 
        document_id: int, 
        user_id: int, 
        file_path: str,
        processing_type: str = "extract_text"
    ) -> bool:
        """Send a message to process a document."""
        try:
            message_data = {
                "document_id": document_id,
                "user_id": user_id,
                "file_path": file_path,
                "processing_type": processing_type,
                "timestamp": datetime.utcnow().isoformat(),
                "retry_count": 0
            }
            
            message = ServiceBusMessage(
                body=json.dumps(message_data),
                content_type="application/json",
                message_id=f"doc-{document_id}-{datetime.utcnow().timestamp()}"
            )
            
            with self.client.get_queue_sender(self.document_processing_queue) as sender:
                sender.send_messages(message)
            
            print(f"Sent document processing message for document {document_id}")
            return True
            
        except ServiceBusError as e:
            print(f"Failed to send document processing message: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error sending message: {e}")
            return False
    
    async def send_search_indexing_message(
        self,
        document_id: int,
        user_id: int,
        action: str = "index"  # index, update, delete
    ) -> bool:
        """Send a message to update search index."""
        try:
            message_data = {
                "document_id": document_id,
                "user_id": user_id,
                "action": action,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            message = ServiceBusMessage(
                body=json.dumps(message_data),
                content_type="application/json",
                message_id=f"search-{document_id}-{action}-{datetime.utcnow().timestamp()}"
            )
            
            with self.client.get_queue_sender(self.search_indexing_queue) as sender:
                sender.send_messages(message)
            
            print(f"Sent search indexing message for document {document_id}, action: {action}")
            return True
            
        except ServiceBusError as e:
            print(f"Failed to send search indexing message: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error sending indexing message: {e}")
            return False
    
    def send_notification_message(self, notification_data: Dict[str, Any]) -> bool:
        """Send a notification message."""
        try:
            sb_message = ServiceBusMessage(
                body=json.dumps(notification_data),
                content_type="application/json",
                message_id=f"notif-{notification_data.get('user_id')}-{datetime.utcnow().timestamp()}"
            )
            
            with self.client.get_queue_sender(self.notifications_queue) as sender:
                sender.send_messages(sb_message)
            
            print(f"Sent notification message for user {notification_data.get('user_id')}")
            return True
            
        except ServiceBusError as e:
            print(f"Failed to send notification message: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error sending notification: {e}")
            return False

    async def send_notification_message_async(
        self,
        user_id: int,
        notification_type: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Send a notification message (async version)."""
        try:
            message_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": notification_type.replace("_", " ").title(),
                "message": message,
                "type": notification_type,
                "timestamp": datetime.utcnow().isoformat(),
                "persistent": False,
                "metadata": metadata or {}
            }
            
            return self.send_notification_message(message_data)
            
        except Exception as e:
            print(f"Unexpected error sending notification: {e}")
            return False
    
    def receive_notifications_messages(self, max_messages: int = 10):
        """Receive notification messages from the queue."""
        try:
            with self.client.get_queue_receiver(self.notifications_queue) as receiver:
                received_msgs = receiver.receive_messages(max_message_count=max_messages, max_wait_time=5)
                return received_msgs
                
        except ServiceBusError as e:
            print(f"Error receiving notification messages: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error in notification receiver: {e}")
            return []
    
    def complete_message(self, message):
        """Complete a message to remove it from the queue."""
        try:
            with self.client.get_queue_receiver(self.notifications_queue) as receiver:
                receiver.complete_message(message)
        except Exception as e:
            print(f"Error completing message: {e}")
    
    def abandon_message(self, message):
        """Abandon a message to put it back in the queue."""
        try:
            with self.client.get_queue_receiver(self.notifications_queue) as receiver:
                receiver.abandon_message(message)
        except Exception as e:
            print(f"Error abandoning message: {e}")
    
    async def receive_document_processing_messages(self, max_messages: int = 10):
        """Receive and process document processing messages."""
        try:
            with self.client.get_queue_receiver(self.document_processing_queue) as receiver:
                received_msgs = receiver.receive_messages(max_message_count=max_messages, max_wait_time=30)
                
                for msg in received_msgs:
                    try:
                        message_data = json.loads(str(msg))
                        print(f"Processing document message: {message_data}")
                        
                        # Process the document (implement your processing logic here)
                        success = await self._process_document(message_data)
                        
                        if success:
                            receiver.complete_message(msg)
                            print(f"Completed processing for document {message_data.get('document_id')}")
                        else:
                            # Increment retry count
                            retry_count = message_data.get('retry_count', 0) + 1
                            if retry_count < 3:
                                message_data['retry_count'] = retry_count
                                # Re-queue with updated retry count
                                await self.send_document_processing_message(
                                    message_data['document_id'],
                                    message_data['user_id'],
                                    message_data['file_path'],
                                    message_data['processing_type']
                                )
                            receiver.complete_message(msg)
                            
                    except Exception as e:
                        print(f"Error processing message: {e}")
                        receiver.abandon_message(msg)
                        
        except ServiceBusError as e:
            print(f"Error receiving messages: {e}")
        except Exception as e:
            print(f"Unexpected error in message receiver: {e}")
    
    async def _process_document(self, message_data: Dict[str, Any]) -> bool:
        """Process a document based on the message data."""
        try:
            document_id = message_data['document_id']
            user_id = message_data['user_id']
            processing_type = message_data['processing_type']
            
            print(f"Processing document {document_id} with type {processing_type}")
            
            # Send notification about processing start
            await self.send_notification_message_async(
                user_id=user_id,
                notification_type="info",
                message=f"Document processing started for document {document_id}",
                metadata={"document_id": document_id, "processing_type": processing_type}
            )
            
            # Here you would implement the actual document processing logic
            # For example: text extraction, OCR, category detection, etc.
            
            # Simulate processing
            import asyncio
            await asyncio.sleep(2)  # Simulate processing time
            
            if processing_type == "extract_text":
                # Extract text from document
                print(f"Extracting text from document {document_id}")
            elif processing_type == "detect_category":
                # Detect document category
                print(f"Detecting category for document {document_id}")
            elif processing_type == "generate_summary":
                # Generate AI summary
                print(f"Generating summary for document {document_id}")
            
            # Send success notification
            await self.send_notification_message_async(
                user_id=user_id,
                notification_type="success",
                message=f"Document processing completed successfully for document {document_id}",
                metadata={"document_id": document_id, "processing_type": processing_type}
            )
            
            return True
            
        except Exception as e:
            print(f"Error in document processing: {e}")
            
            # Send error notification
            if 'user_id' in message_data:
                await self.send_notification_message_async(
                    user_id=message_data['user_id'],
                    notification_type="error",
                    message=f"Document processing failed for document {message_data.get('document_id', 'unknown')}",
                    metadata={"document_id": message_data.get('document_id'), "error": str(e)}
                )
            
            return False
    
    async def receive_search_indexing_messages(self, max_messages: int = 10):
        """Receive and process search indexing messages."""
        try:
            with self.client.get_queue_receiver(self.search_indexing_queue) as receiver:
                received_msgs = receiver.receive_messages(max_message_count=max_messages, max_wait_time=30)
                
                for msg in received_msgs:
                    try:
                        message_data = json.loads(str(msg))
                        print(f"Processing search indexing message: {message_data}")
                        
                        # Process the search indexing
                        success = await self._process_search_indexing(message_data)
                        
                        if success:
                            receiver.complete_message(msg)
                            print(f"Completed search indexing for document {message_data.get('document_id')}")
                        else:
                            print(f"Failed to process search indexing for document {message_data.get('document_id')}")
                            receiver.abandon_message(msg)
                            
                    except Exception as e:
                        print(f"Error processing search indexing message: {e}")
                        receiver.abandon_message(msg)
                        
        except ServiceBusError as e:
            print(f"Error receiving search indexing messages: {e}")
        except Exception as e:
            print(f"Unexpected error in search indexing receiver: {e}")

    async def _process_search_indexing(self, message_data: Dict[str, Any]) -> bool:
        """Process a search indexing message."""
        try:
            document_id = message_data['document_id']
            user_id = message_data['user_id']
            action = message_data.get('action', 'index')
            
            print(f"Processing search indexing for document {document_id}, action: {action}")
            
            # Import here to avoid circular imports
            from app.services.azure_search import AzureSearchService
            from app.database import SessionLocal
            from app.models import Document
            
            # Get document from database
            db = SessionLocal()
            try:
                document = db.query(Document).filter(
                    Document.id == document_id,
                    Document.user_id == user_id
                ).first()
                
                if not document:
                    print(f"Document {document_id} not found for user {user_id}")
                    return False
                
                # Initialize Azure Search service
                azure_search = AzureSearchService()
                
                if action == "index":
                    # Generate blob path for the document
                    blob_path = f"user_{user_id}/{document.original_filename}"
                    
                    # Index the document
                    success = azure_search.index_document(document, blob_path)
                    if success:
                        print(f"Successfully indexed document {document_id} to Azure Search")
                    else:
                        print(f"Failed to index document {document_id} to Azure Search")
                    return success
                    
                elif action == "delete":
                    # Delete from search index
                    success = azure_search.delete_document(str(document_id))
                    if success:
                        print(f"Successfully deleted document {document_id} from Azure Search")
                    else:
                        print(f"Failed to delete document {document_id} from Azure Search")
                    return success
                    
                else:
                    print(f"Unknown search indexing action: {action}")
                    return False
                    
            finally:
                db.close()
            
        except Exception as e:
            print(f"Error in search indexing processing: {e}")
            return False

    async def test_connection(self) -> bool:
        """Test connection to Azure Service Bus."""
        try:
            # Try to get queue properties for one of the queues
            with self.client.get_queue_receiver(self.document_processing_queue) as receiver:
                # Just test the connection, don't receive messages
                pass
            return True
        except Exception as e:
            print(f"Azure Service Bus connection test failed: {e}")
            return False
    
    def close(self):
        """Close the Service Bus client."""
        if hasattr(self, 'client'):
            self.client.close()
    
    def __del__(self):
        """Cleanup when object is destroyed."""
        self.close()