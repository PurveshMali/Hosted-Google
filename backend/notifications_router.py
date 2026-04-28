from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from firebase_config import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import decode_access_token

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_access_token(credentials.credentials)
        return payload 
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

@router.get("")
async def get_my_notifications(user: dict = Depends(get_current_user)):
    """Fetches all unread notifications for the logged in user with in-memory sorting to avoid index errors."""
    try:
        # Fetch by user_id and is_read (equality filters are generally safe)
        docs = db.collection("notifications")\
                 .where("user_id", "==", user["sub"])\
                 .where("is_read", "==", False)\
                 .stream()
        
        notifications = [doc.to_dict() for doc in docs]
        
        # Sort in-memory by created_at DESC (Newest first)
        notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return notifications
    except Exception as e:
        print(f"NOTIFICATION FETCH ERROR: {e}")
        # Fallback: if even the double equality fails without index, fetch by user_id only
        docs = db.collection("notifications").where("user_id", "==", user["sub"]).stream()
        notifications = [doc.to_dict() for doc in docs if not doc.to_dict().get("is_read")]
        notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return notifications

@router.patch("/{notif_id}/read")
async def mark_as_read(notif_id: str, user: dict = Depends(get_current_user)):
    notif_ref = db.collection("notifications").document(notif_id)
    notif = notif_ref.get()
    if not notif.exists:
        raise HTTPException(404, "Notification not found")
    
    data = notif.to_dict()
    if data["user_id"] != user["sub"]:
        raise HTTPException(403, "Not authorized")
        
    notif_ref.update({"is_read": True})
    return {"message": "Notification marked as read"}

@router.post("/clear-all")
async def clear_all_notifications(user: dict = Depends(get_current_user)):
    docs = db.collection("notifications")\
             .where("user_id", "==", user["sub"])\
             .where("is_read", "==", False)\
             .stream()
    
    batch = db.batch()
    for doc in docs:
        batch.update(doc.reference, {"is_read": True})
    batch.commit()
    
    return {"message": "All notifications cleared"}
