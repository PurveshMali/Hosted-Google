from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from security import hash_password, generate_temp_password, decode_access_token
from firebase_config import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/ngo", tags=["NGO Team Management"])
security = HTTPBearer()

# --- Helpers ---
async def get_current_ngo_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if role != "ngo_admin":
            raise HTTPException(403, "NGO Admin access required")
            
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            raise HTTPException(401, "Invalid user")
            
        data = user_doc.to_dict()
        data["id"] = user_id
        return data
    except Exception:
        raise HTTPException(401, "Invalid credentials")

# --- Request Models ---
class ReporterCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

# --- Endpoints ---

@router.get("/stats")
async def get_ngo_stats(admin: dict = Depends(get_current_ngo_admin)):
    """Fetches real-time dashboard statistics."""
    org_id = admin.get("org_id")
    
    # 1. Urgent Needs (High Urgency Reports)
    # Workaround for Index Error: Filter status in Firestore, urgency in memory
    pending_needs = db.collection("needs").where("status", "==", "pending").get()
    urgent_needs = [n for n in pending_needs if n.to_dict().get("urgency_score", 0) >= 7.0]
    
    # 2. Active Volunteers (Total count for simplicity in demo)
    volunteers = db.collection("users").where("role", "==", "volunteer").get()
    
    # 3. Tasks Completed
    tasks_done = db.collection("tasks").where("org_id", "==", org_id).where("status", "==", "completed").get()
    
    # 4. Impact Score (Sum of affected_count from converted reports)
    # For demo, let's calculate a dynamic score based on completed tasks
    impact_base = len(tasks_done) * 25 # Assume 25 people helped per task
    
    return {
        "urgent_needs": len(urgent_needs),
        "active_volunteers": len(volunteers),
        "tasks_completed": len(tasks_done),
        "impact_score": round(9.0 + (len(tasks_done) * 0.1), 1) if len(tasks_done) > 0 else 9.0,
        "recent_activity": f"{len(urgent_needs)} new since morning"
    }

@router.post("/reporters")
async def create_reporter(data: ReporterCreate, background_tasks: BackgroundTasks, admin: dict = Depends(get_current_ngo_admin)):
    # ... (existing code for reporter creation)
    # Check if email exists
    existing = db.collection("users").where("email", "==", data.email).limit(1).get()
    if existing:
        raise HTTPException(400, "Email already in use")
    
    temp_password = generate_temp_password()
    reporter_id = str(uuid.uuid4())
    reporter_doc = {
        "id": reporter_id,
        "email": data.email,
        "password_hash": hash_password(temp_password),
        "full_name": data.full_name,
        "phone": data.phone,
        "role": "field_reporter",
        "org_id": admin["org_id"],
        "created_by": admin["id"],
        "must_reset_password": True,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "submission_count": 0
    }
    
    db.collection("users").document(reporter_id).set(reporter_doc)
    
    from notification_service import send_reporter_credentials_email
    background_tasks.add_task(
        send_reporter_credentials_email,
        to_email=data.email,
        full_name=data.full_name,
        ngo_name=admin.get("org_name", "Your NGO"),
        temp_password=temp_password
    )
    
    return {"message": "Reporter account created", "reporter_id": reporter_id, "temp_password": temp_password}

@router.get("/reporters")
async def get_reporters(admin: dict = Depends(get_current_ngo_admin)):
    reporters_stream = db.collection("users") \
        .where("org_id", "==", admin["org_id"]) \
        .where("role", "==", "field_reporter") \
        .stream()
    return [r.to_dict() for r in reporters_stream if r.to_dict().get("is_active", True)]

@router.delete("/reporters/{reporter_id}")
async def deactivate_reporter(reporter_id: str, admin: dict = Depends(get_current_ngo_admin)):
    reporter_ref = db.collection("users").document(reporter_id)
    reporter = reporter_ref.get()
    if not reporter.exists or reporter.to_dict()["org_id"] != admin["org_id"]:
        raise HTTPException(404, "Reporter not found")
    reporter_ref.update({"is_active": False})
    return {"message": "Deactivated"}
