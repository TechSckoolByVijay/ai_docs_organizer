"""
Azure Blob Storage service for file storage and management.
"""
import os
import uuid
from typing import Optional, Tuple
from azure.storage.blob import BlobServiceClient, ContentSettings
from azure.core.exceptions import ResourceExistsError, ResourceNotFoundError
from fastapi import UploadFile
from datetime import datetime


class AzureBlobService:
    """Service for Azure Blob Storage operations."""
    
    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        self.account_url = os.getenv("AZURE_STORAGE_ACCOUNT_URL")
        self.container_name = os.getenv("AZURE_STORAGE_CONTAINER", "receipts-documents")
        
        if not self.connection_string:
            raise ValueError("Azure Storage connection string must be configured")
        
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        
        # Create container if it doesn't exist
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Ensure the storage container exists."""
        try:
            self.blob_service_client.create_container(self.container_name)
            print(f"Created container: {self.container_name}")
        except ResourceExistsError:
            # Container already exists
            pass
        except Exception as e:
            print(f"Error creating container: {e}")
    
    async def test_connection(self) -> bool:
        """Test connection to Azure Blob Storage."""
        try:
            # Try to get container properties
            container_client = self.blob_service_client.get_container_client(self.container_name)
            container_client.get_container_properties()
            return True
        except Exception as e:
            print(f"Azure Blob Storage connection test failed: {e}")
            return False
    
    def generate_blob_path(self, user_id: int, filename: str) -> str:
        """Generate a unique blob path for a file."""
        # Extract file extension
        file_ext = ""
        if "." in filename:
            file_ext = filename.split(".")[-1]
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        
        if file_ext:
            blob_name = f"user_{user_id}/{unique_id}.{file_ext}"
        else:
            blob_name = f"user_{user_id}/{unique_id}"
        
        return blob_name
    
    def upload_file(self, user_id: int, file: UploadFile) -> Tuple[str, int]:
        """
        Upload a file to Azure Blob Storage.
        
        Returns:
            Tuple of (blob_path, file_size)
        """
        try:
            # Generate blob path
            blob_path = self.generate_blob_path(user_id, file.filename or "unknown")
            
            # Read file content
            file_content = file.file.read()
            file_size = len(file_content)
            
            # Reset file pointer for potential reuse
            file.file.seek(0)
            
            # Upload to blob storage
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_path
            )
            
            # Set content type and metadata
            content_settings = ContentSettings(
                content_type=file.content_type or 'application/octet-stream'
            )
            
            metadata = {
                'original_filename': file.filename or 'unknown',
                'upload_date': datetime.utcnow().isoformat(),
                'user_id': str(user_id)
            }
            
            blob_client.upload_blob(
                file_content,
                overwrite=True,
                content_settings=content_settings,
                metadata=metadata
            )
            
            print(f"Uploaded file to blob: {blob_path}")
            return blob_path, file_size
            
        except Exception as e:
            print(f"Error uploading file to blob storage: {e}")
            raise
    
    def download_file(self, blob_path: str) -> Optional[bytes]:
        """Download a file from Azure Blob Storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_path
            )
            
            return blob_client.download_blob().readall()
            
        except ResourceNotFoundError:
            print(f"Blob not found: {blob_path}")
            return None
        except Exception as e:
            print(f"Error downloading blob {blob_path}: {e}")
            return None
    
    def delete_file(self, blob_path: str) -> bool:
        """Delete a file from Azure Blob Storage."""
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_path
            )
            
            blob_client.delete_blob()
            print(f"Deleted blob: {blob_path}")
            return True
            
        except ResourceNotFoundError:
            print(f"Blob not found for deletion: {blob_path}")
            return True  # Consider it deleted
        except Exception as e:
            print(f"Error deleting blob {blob_path}: {e}")
            return False