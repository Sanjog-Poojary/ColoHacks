from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.lib.firebase_admin import db
from app.lib.auth_middleware import get_current_user
import logging, uuid

router = APIRouter()
logger = logging.getLogger(__name__)

class ShopCreate(BaseModel):
    name: str
    city: str
    business_type: str

@router.post('/shops')
async def create_shop(shop: ShopCreate, user: dict = Depends(get_current_user)):
    uid = user['uid']
    shop_id = str(uuid.uuid4())
    shop_doc = {**shop.dict(), 'owner': uid, 'shop_id': shop_id}
    try:
        db.collection('shops').document(shop_id).set(shop_doc)
        # Also update user's shops list
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        if user_doc.exists:
            user_ref.update({'shops': user_doc.to_dict().get('shops', []) + [shop_id]})
        else:
            user_ref.set({'uid': uid, 'shops': [shop_id]})
        return shop_doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/shops')
async def list_shops(user: dict = Depends(get_current_user)):
    uid = user['uid']
    try:
        docs = db.collection('shops').where('owner', '==', uid).stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/shops/{shop_id}')
async def delete_shop(shop_id: str, user: dict = Depends(get_current_user)):
    uid = user['uid']
    try:
        shop_ref = db.collection('shops').document(shop_id)
        shop_doc = shop_ref.get()
        if not shop_doc.exists:
            raise HTTPException(status_code=404, detail='Shop not found')
        
        if shop_doc.to_dict().get('owner') != uid:
            raise HTTPException(status_code=403, detail='Not authorized to delete this shop')
        
        # Delete shop doc
        shop_ref.delete()
        
        # Remove from user's shops list
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()
        if user_doc.exists:
            shops = user_doc.to_dict().get('shops', [])
            if shop_id in shops:
                shops.remove(shop_id)
                user_ref.update({'shops': shops})
        
        return {'status': 'success'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))