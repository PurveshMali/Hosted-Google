from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import uuid
import math
from datetime import datetime, timezone
from firebase_config import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import decode_access_token
from ai_service import suggest_task_fields

router = APIRouter(prefix="/api/tasks", tags=["Volunteer Tasks"])
security = HTTPBearer()

# --- Security Dependency ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_access_token(credentials.credentials)
        return payload 
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

# --- Helpers ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dlat, dlon = math.radians(lat2-lat1), math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

# --- Request Models ---
class TaskCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str
    skills_required: List[str]
    volunteer_needed: int
    location_name: str
    latitude: float
    longitude: float
    report_id: Optional[str] = None

class ProofSubmit(BaseModel):
    proof_url: str
    volunteer_notes: Optional[str] = ""

# --- Endpoints ---

@router.post("")
async def create_task(data: TaskCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "ngo_admin":
        raise HTTPException(403, "NGO Admin required")
    
    task_id = str(uuid.uuid4())
    task_doc = {
        "id": task_id, "org_id": user.get("org_id"), "created_by": user["sub"],
        "title": data.title, "description": data.description, "category": data.category,
        "priority": data.priority, "skills_required": data.skills_required,
        "volunteer_needed": data.volunteer_needed, "volunteer_count": 0,
        "location_name": data.location_name, "latitude": data.latitude, "longitude": data.longitude,
        "report_id": data.report_id, "status": "open", "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.collection("tasks").document(task_id).set(task_doc)

    if data.report_id:
        report_ref = db.collection("needs").document(data.report_id)
        report_ref.update({"status": "converted"})
        report = report_ref.get().to_dict()
        reporter_id = report.get("reporter_id")

        # IN-APP NOTIFICATION instead of Email
        notif_id = str(uuid.uuid4())
        notification = {
            "id": notif_id,
            "user_id": reporter_id,
            "type": "report_accepted",
            "title": "Report Accepted! ✅",
            "message": f"Your report on '{data.title}' has been accepted by HQ and converted into a relief task.",
            "task_id": task_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.collection("notifications").document(notif_id).set(notification)
        
    return task_doc

@router.get("/matched")
async def get_matched_tasks(user: dict = Depends(get_current_user)):
    if user["role"] != "volunteer": raise HTTPException(403, "Volunteers only")
    p = db.collection("volunteer_profiles").document(user["sub"]).get().to_dict()
    v_lat, v_lng, v_skills = p.get("home_lat"), p.get("home_lng"), set(p.get("skills", []))
    v_radius = p.get("preferred_radius_km", 20.0)
    tasks = db.collection("tasks").where("status", "==", "open").stream()
    matched = []
    for doc in tasks:
        t = doc.to_dict()
        dist = haversine(v_lat, v_lng, t["latitude"], t["longitude"]) if v_lat else 999
        t_skills = set(t.get("skills_required", []))
        score = len(v_skills.intersection(t_skills)) / len(t_skills) if t_skills else 1.0
        if dist <= v_radius or score > 0.5:
            t["distance_km"], t["match_score"] = round(dist, 1), score
            matched.append(t)
    matched.sort(key=lambda x: ({"Critical": 0, "High": 1, "Medium": 2, "Low": 3}.get(x["priority"], 99), x["distance_km"]))
    return matched

@router.post("/{task_id}/proof")
async def submit_task_proof(task_id: str, data: ProofSubmit, user: dict = Depends(get_current_user)):
    if user["role"] != "volunteer": raise HTTPException(403, "Volunteers only")
    db.collection("tasks").document(task_id).update({
        "status": "pending_completion", "proof_url": data.proof_url,
        "volunteer_notes": data.volunteer_notes, "completed_by": user["sub"],
        "proof_submitted_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Proof submitted."}

@router.patch("/{task_id}/complete")
async def verify_and_complete_task(task_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "ngo_admin": raise HTTPException(403, "NGO Admins only")
    db.collection("tasks").document(task_id).update({
        "status": "completed", "verified_at": datetime.now(timezone.utc).isoformat(), "verified_by": user["sub"]
    })
    return {"message": "Task completed."}

@router.get("")
async def get_all_tasks(user: dict = Depends(get_current_user)):
    if user["role"] == "ngo_admin":
        docs = db.collection("tasks").where("org_id", "==", user.get("org_id")).stream()
    else:
        docs = db.collection("tasks").where("status", "==", "open").stream()
    return [doc.to_dict() for doc in docs]
