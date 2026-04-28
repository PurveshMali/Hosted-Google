import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    """
    Initializes Firebase Admin SDK using the service account JSON.
    """
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    service_account_dict = os.getenv("FIREBASE_SERVICE_ACCOUNT_DICT")
    database_url = os.getenv("FIREBASE_DATABASE_URL")

    if not firebase_admin._apps:
        # First try loading from a JSON string (Vercel best practice)
        if service_account_dict:
            import json
            try:
                cred_dict = json.loads(service_account_dict)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {'databaseURL': database_url})
                print("Firebase Admin SDK initialized via JSON dict.")
            except Exception as e:
                print(f"Error parsing FIREBASE_SERVICE_ACCOUNT_DICT: {e}")
                return None, None
        # Fallback to local file path (Local development)
        elif service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': database_url
            })
            print("Firebase Admin SDK initialized via file.")
        else:
            print("Warning: Firebase credentials not found.")
            return None, None

    return firestore.client(), auth

db, auth_admin = initialize_firebase()
