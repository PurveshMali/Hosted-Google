from fastapi import APIRouter, HTTPException, Request, Response, Cookie
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from security import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, hash_token
)
from firebase_config import db

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Request Models ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str # ngo_admin, community_member
    org_name: Optional[str] = None

class VolunteerRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    # Volunteer Fields
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    home_lat: Optional[float] = None
    home_lng: Optional[float] = None
    preferred_radius_km: Optional[float] = 10.0
    languages: List[str] = ["English"]

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- Endpoints ---

@router.post("/register")
async def register_user(data: UserRegister):
    try:
        # 1. Validation
        if data.role not in ["ngo_admin", "community_member"]:
            raise HTTPException(400, "Invalid role for this endpoint")
        
        # Check if user exists
        existing_users = db.collection("users").where("email", "==", data.email).limit(1).get()
        if existing_users:
            raise HTTPException(400, "Email already registered")
        
        # 2. Create User Record
        user_id = str(uuid.uuid4())
        hashed = hash_password(data.password)
        
        user_doc = {
            "id": user_id,
            "email": data.email,
            "password_hash": hashed,
            "full_name": data.full_name,
            "role": data.role,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # 3. Role-Specific Profiles (Separated Tables)
        if data.role == "community":
            profile_doc = {
                "user_id": user_id,
                "verified": False,
                "trust_score": 50
            }
            db.collection("community_profiles").document(user_id).set(profile_doc)
        if data.role == "ngo_admin":
            if not data.org_name:
                raise HTTPException(400, "Organization name required for NGO Admin")
            
            org_id = str(uuid.uuid4())
            org_doc = {
                "id": org_id,
                "name": data.org_name,
                "admin_id": user_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.collection("organizations").document(org_id).set(org_doc)
            
            # Create dedicated NGO Profile
            profile_doc = {
                "user_id": user_id,
                "org_id": org_id,
                "org_name": data.org_name,
                "is_verified": True
            }
            db.collection("ngo_profiles").document(user_id).set(profile_doc)
            
            user_doc["org_id"] = org_id
        
        db.collection("users").document(user_id).set(user_doc)
        return {"message": "Registration successful. Please log in."}
    except Exception as e:
        print(f"REGISTRATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Internal Server Error: {str(e)}")

@router.post("/register/volunteer")
async def register_volunteer(data: VolunteerRegister):
    # 1. Validation
    existing_users = db.collection("users").where("email", "==", data.email).limit(1).get()
    if existing_users:
        raise HTTPException(400, "Email already registered")
    
    # 2. Create User Record
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "role": "volunteer",
        "phone": data.phone,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # 3. Create Volunteer Profile
    profile_doc = {
        "user_id": user_id,
        "skills": data.skills,
        "home_lat": data.home_lat,
        "home_lng": data.home_lng,
        "preferred_radius_km": data.preferred_radius_km,
        "languages": data.languages,
        "impact_score": 0,
        "is_available": True
    }
    
    db.collection("users").document(user_id).set(user_doc)
    db.collection("volunteer_profiles").document(user_id).set(profile_doc)
    
    return {"message": "Volunteer profile created. Please log in."}

@router.post("/login")
async def login(data: LoginRequest, request: Request, response: Response):
    # 1. Fetch User
    user_query = db.collection("users").where("email", "==", data.email).limit(1).get()
    if not user_query:
        raise HTTPException(401, "Invalid email or password")
    
    user = user_query[0].to_dict()
    
    if not user.get("is_active"):
        raise HTTPException(403, "Account deactivated")
    
    # 2. Verify Password
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    
    # 3. Check if password reset is required (for Field Reporters)
    if user.get("must_reset_password"):
        # Generate a temporary reset token
        reset_token = secrets.token_urlsafe(32)
        # Store reset token in Firestore
        db.collection("password_reset_tokens").document(user["id"]).set({
            "token": reset_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        })
        return {
            "must_reset_password": True, 
            "reset_token": reset_token,
            "user_id": user["id"]
        }

    # 4. Generate Tokens
    access_token = create_access_token({
        "sub": user["id"],
        "role": user["role"],
        "org_id": user.get("org_id")
    })
    
    raw_refresh, hashed_refresh = create_refresh_token()
    
    # 5. Store Refresh Token
    db.collection("refresh_tokens").document(hashed_refresh).set({
        "user_id": user["id"],
        "token_hash": hashed_refresh,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "is_revoked": False,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # 6. Set httpOnly Cookie
    response.set_cookie(
        key="refreshToken",
        value=raw_refresh,
        httponly=True,
        secure=True, # Set to True in production
        samesite="strict",
        path="/auth/refresh",
        max_age=604800 # 7 days
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "role": user["role"],
            "org_id": user.get("org_id")
        }
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.post("/refresh")
async def refresh(request: Request, response: Response, refreshToken: Optional[str] = Cookie(None)):
    if not refreshToken:
        raise HTTPException(401, "Refresh token missing")
    
    token_hash = hash_token(refreshToken)
    token_doc = db.collection("refresh_tokens").document(token_hash).get()
    
    if not token_doc.exists:
        raise HTTPException(401, "Invalid refresh token")
    
    token_data = token_doc.to_dict()
    
    # 1. Replay Attack Detection
    if token_data.get("is_revoked"):
        # Nuke all sessions for this user!
        all_tokens = db.collection("refresh_tokens").where("user_id", "==", token_data["user_id"]).stream()
        for t in all_tokens:
            db.collection("refresh_tokens").document(t.id).update({"is_revoked": True})
        raise HTTPException(401, "Security violation detected. All sessions revoked.")
    
    # 2. Expiry Check
    if datetime.fromisoformat(token_data["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(401, "Refresh token expired")
    
    # 3. Rotate Tokens
    db.collection("refresh_tokens").document(token_hash).update({"is_revoked": True})
    
    user_doc = db.collection("users").document(token_data["user_id"]).get()
    if not user_doc.exists:
        raise HTTPException(401, "User no longer exists. Please log in again.")
        
    user = user_doc.to_dict()
    
    new_access_token = create_access_token({
        "sub": user["id"],
        "role": user["role"],
        "org_id": user.get("org_id")
    })
    
    new_raw_refresh, new_hashed_refresh = create_refresh_token()
    
    db.collection("refresh_tokens").document(new_hashed_refresh).set({
        "user_id": user["id"],
        "token_hash": new_hashed_refresh,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "is_revoked": False,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="refreshToken",
        value=new_raw_refresh,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/auth/refresh",
        max_age=604800
    )
    
    return {"access_token": new_access_token}

@router.post("/logout")
async def logout(response: Response, refreshToken: Optional[str] = Cookie(None)):
    if refreshToken:
        token_hash = hash_token(refreshToken)
        db.collection("refresh_tokens").document(token_hash).update({"is_revoked": True})
    
    response.delete_cookie("refreshToken", path="/auth/refresh")
    return {"message": "Logged out successfully"}

@router.get("/me")
async def get_me(request: Request):
    # This will be secured by the dependency later
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(401, "Missing token")
    
    token = auth_header.split(" ")[1]
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(404, "User not found")
        
    user = user_doc.to_dict()
    # Remove sensitive info
    user.pop("password_hash", None)
    
    # If volunteer, attach profile
    if user["role"] == "volunteer":
        profile = db.collection("volunteer_profiles").document(user_id).get()
        if profile.exists:
            user["profile"] = profile.to_dict()
            
    return user

@router.post("/reset-password")
async def reset_password(data: dict):
    # {reset_token, new_password}
    token = data.get("reset_token")
    new_password = data.get("new_password")
    
    # In a real app, you'd lookup the token in password_reset_tokens
    # For now, we'll implement the logic
    user_query = db.collection("users").where("id", "==", data.get("user_id")).limit(1).get()
    if not user_query:
        raise HTTPException(404, "User not found")
        
    user_id = user_query[0].id
    db.collection("users").document(user_id).update({
        "password_hash": hash_password(new_password),
        "must_reset_password": False
    })
    
    return {"message": "Password updated successfully. You can now log in."}
