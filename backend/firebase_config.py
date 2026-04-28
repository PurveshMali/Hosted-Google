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
    database_url = os.getenv("FIREBASE_DATABASE_URL")

    if not firebase_admin._apps:
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': database_url
            })
            print("Firebase Admin SDK initialized.")
        else:
            print("Warning: Firebase service account JSON not found.")
            return None, None

    return firestore.client(), auth

db, auth_admin = initialize_firebase()
