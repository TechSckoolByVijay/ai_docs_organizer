from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
import json
from ..services.azure_servicebus import AzureServiceBusService
from .auth import get_current_user
from ..models import User

router = APIRouter()

# Initialize Azure Service Bus service
try:
    service_bus_service = AzureServiceBusService()
except Exception as e:
    print(f"Warning: Azure Service Bus not configured: {e}")
    service_bus_service = None

@router.get("/notifications", response_model=List[dict])
async def get_notifications(current_user: User = Depends(get_current_user)):
    """
    Get all notifications from the Service Bus notifications queue for the current user
    """
    if not service_bus_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Service Bus is not configured"
        )
    
    try:
        # Receive messages from the notifications queue
        messages = service_bus_service.receive_notifications_messages()
        notifications = []
        
        for message in messages:
            try:
                # Parse the message body
                message_body = json.loads(str(message))
                
                # Check if notification is for current user
                if message_body.get('user_id') == current_user.id:
                    notification = {
                        "id": message_body.get('id', str(datetime.now().timestamp())),
                        "title": message_body.get('title', 'Notification'),
                        "message": message_body.get('message', ''),
                        "type": message_body.get('type', 'info'),
                        "timestamp": message_body.get('timestamp', datetime.now().isoformat()),
                        "isRead": False,
                        "persistent": message_body.get('persistent', False),
                        "metadata": message_body.get('metadata', {})
                    }
                    notifications.append(notification)
                    
                    # Complete the message to remove it from queue
                    service_bus_service.complete_message(message)
                else:
                    # Abandon message if not for current user (will be redelivered)
                    service_bus_service.abandon_message(message)
                    
            except json.JSONDecodeError:
                print(f"Error parsing notification message: {message}")
                # Complete malformed messages to remove them
                service_bus_service.complete_message(message)
                continue
                
        return notifications
        
    except Exception as e:
        print(f"Error retrieving notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving notifications: {str(e)}"
        )

@router.post("/notifications/send")
async def send_notification(
    title: str,
    message: str,
    notification_type: str = "info",
    persistent: bool = False,
    current_user: User = Depends(get_current_user)
):
    """
    Send a notification to the notifications queue (for testing purposes)
    """
    if not service_bus_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Service Bus is not configured"
        )
    
    try:
        notification_data = {
            "id": str(datetime.now().timestamp()),
            "user_id": current_user.id,
            "title": title,
            "message": message,
            "type": notification_type,
            "timestamp": datetime.now().isoformat(),
            "persistent": persistent,
            "metadata": {}
        }
        
        # Send notification to queue
        service_bus_service.send_notification_message(notification_data)
        
        return {
            "status": "success",
            "message": "Notification sent successfully"
        }
        
    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending notification: {str(e)}"
        )

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification as deleted (this is handled on the frontend)
    """
    return {
        "status": "success",
        "message": f"Notification {notification_id} marked as deleted"
    }