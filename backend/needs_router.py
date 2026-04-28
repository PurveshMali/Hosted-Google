from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone
from firebase_config import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import decode_access_token
from ai_service import extract_needs_from_text

router = APIRouter(prefix="/api", tags=["Needs & Reports"])
security = HTTPBearer()

# --- Security Dependency ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = decode_access_token(credentials.credentials)
        return payload 
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

# --- Request Models ---
class NeedSubmit(BaseModel):
    description: str
    location_name: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None

class ExtractRequest(BaseModel):
    description: str

# --- Endpoints ---

@router.get("/reports")
async def get_all_reports(user: dict = Depends(get_current_user)):
    """Fetches all pending/active needs for the NGO Dashboard map."""
    docs = db.collection("needs").where("status", "==", "pending").stream()
    return [doc.to_dict() for doc in docs]

@router.post("/reports/extract")
async def extract_report_info(data: ExtractRequest, user: dict = Depends(get_current_user)):
    """Uses Google Gemini to extract structured info from a raw report."""
    try:
        extraction = extract_needs_from_text(data.description)
        return extraction
    except Exception as e:
        print(f"AI ERROR: {str(e)}")
        raise HTTPException(500, f"AI Extraction failed: {str(e)}")

@router.post("/needs/submit")
async def submit_need(data: NeedSubmit, user: dict = Depends(get_current_user)):
    """Endpoint for Reporters (Sunita) to submit ground data."""
    if user["role"] not in ["field_reporter", "ngo_admin", "community_member"]:
        raise HTTPException(403, "Not authorized to submit reports")

    # Call Gemini to get structured data for the record
    try:
        ai_data = extract_needs_from_text(data.description)
    except Exception:
        ai_data = {"category": "other", "urgency_score": 5.0, "affected_count": None, "summary": data.description}

    need_id = str(uuid.uuid4())
    need_doc = {
        "id": need_id,
        "reporter_id": user["sub"],
        "description": data.description,
        "location_name": data.location_name,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "image_url": data.image_url,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        # AI Augmented Data
        "category": ai_data.get("category", "other"),
        "urgency_score": ai_data.get("urgency_score", 5.0),
        "affected_count": ai_data.get("affected_count"),
        "ai_summary": ai_data.get("summary")
    }
    
    db.collection("needs").document(need_id).set(need_doc)
    return need_doc

@router.post("/reports/{report_id}/ignore")
async def ignore_report(report_id: str, user: dict = Depends(get_current_user)):
    """Transfers a report to the secondary 'ignored_reports' collection."""
    if user["role"] != "ngo_admin":
        raise HTTPException(403, "Only NGO Admins can ignore reports")
        
    report_ref = db.collection("needs").document(report_id)
    report = report_ref.get()
    
    if not report.exists:
        raise HTTPException(404, "Report not found")
        
    report_data = report.to_dict()
    report_data["ignored_at"] = datetime.now(timezone.utc).isoformat()
    report_data["ignored_by"] = user["sub"]
    
    # 1. Save to secondary collection
    db.collection("ignored_reports").document(report_id).set(report_data)
    
    # 2. Delete from main collection
    report_ref.delete()
    
    return {"message": "Report transferred to ignored_reports"}
