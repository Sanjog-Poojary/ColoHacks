import firebase_admin
from firebase_admin import credentials, firestore
import os

# Path to the service account key file
key_path = os.path.join(os.path.dirname(__file__), '..', '..', 'serviceAccountKey.json')

if not firebase_admin._apps:
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()