import hashlib
import secrets
import string
import random
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-dev-only")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashes a plain-text password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Verifies a plain-text password against a hashed version."""
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    """
    Creates a short-lived JWT access token.
    Payload includes: sub (uid), role, org_id, etc.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token() -> Tuple[str, str]:
    """
    Generates a secure raw refresh token and its SHA-256 hash.
    Raw token -> Set as httpOnly cookie.
    Hashed token -> Stored in Firestore 'refresh_tokens' collection.
    """
    raw_token = secrets.token_urlsafe(64)
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, hashed_token

def hash_token(raw_token: str) -> str:
    """Hashes a raw token for database comparison."""
    return hashlib.sha256(raw_token.encode()).hexdigest()

def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT access token."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

def generate_temp_password(length: int = 12) -> str:
    """
    Generates a high-entropy temporary password for new Field Reporters.
    Pattern: Includes uppercase, lowercase, digits, and special characters.
    """
    if length < 8:
        length = 8
        
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%"
    
    # Ensure at least one of each category
    password = [
        random.choice(uppercase),
        random.choice(lowercase),
        random.choice(digits),
        random.choice(special)
    ]
    
    # Fill the rest
    all_chars = uppercase + lowercase + digits + special
    password += random.choices(all_chars, k=length - 4)
    
    random.shuffle(password)
    return "".join(password)
