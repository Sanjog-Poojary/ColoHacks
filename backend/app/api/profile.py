from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.lib.firebase_admin import db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class Profile(BaseModel):
    name: str
    city: str
    business_type: str

@router.post('/profile')
async def save_profile(profile: Profile):
    try:
        # For v1, we only handle one global profile for the demo
        # In a real app, this would use the vendor_id from Firebase Auth
        db.collection('profile').document('vendor_1').set(profile.dict())
        return {'message': 'Profile saved'}
    except Exception as e:
        logger.error(f'Profile save error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/profile')
async def get_profile():
    try:
        doc = db.collection('profile').document('vendor_1').get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        logger.error(f'Profile fetch error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))