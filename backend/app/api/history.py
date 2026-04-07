from fastapi import APIRouter, HTTPException, Query, Depends, Header, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.lib.firebase_admin import db
from google.cloud.firestore_v1 import query as firestore_query
from app.lib.auth_middleware import get_current_user
from groq import Groq
import os, json, logging, datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))


class TranslateRequest(BaseModel):
    text: str


@router.get('/ledger')
async def get_ledger(user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    """
    Retrieves the ledger history for a specific shop.
    Returns all records for the shop, handles legacy records with missing UIDs.
    """
    try:
        uid = user['uid']
        # Filter by shop_id first
        docs = (
            db.collection('ledger')
            .where('shop_id', '==', x_shop_id)
            .stream()
        )
        history = []
        for doc in docs:
            data = doc.to_dict()
            
            # Security: Only show records that belong to this user
            # Handle legacy records (where uid might be None) by allowing them if they match shop_id
            record_uid = data.get('uid')
            if record_uid and record_uid != uid:
                continue # Belongs to someone else
                
            data['id'] = doc.id
            history.append(data)
        
        # Sort manually by createdAt (newest first)
        history.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return history
    except Exception as e:
        logger.error(f'History error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/ledger/{entry_id}')
async def delete_entry(
    entry_id: str, 
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user), 
    x_shop_id: str = Header(...)
):
    """
    Deletes a specific ledger entry after verifying user ownership.
    """
    try:
        from app.lib.cache import invalidate_health_cache, invalidate_insights_cache

        uid = user['uid']
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
        
        data = doc.to_dict()
        record_uid = data.get('uid')
        # Allow deletion if UID matches OR if it's a legacy record (UID is None) belonging to this shop
        if record_uid and record_uid != uid:
             raise HTTPException(status_code=403, detail='Permission denied')
        
        if data.get('shop_id') != x_shop_id:
             raise HTTPException(status_code=403, detail='Permission denied (shop mismatch)')
            
        doc_ref.delete()
        
        # Invalidate caches
        background_tasks.add_task(invalidate_health_cache, x_shop_id)
        background_tasks.add_task(invalidate_insights_cache, x_shop_id)
        
        return {'message': 'Entry deleted successfully'}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Delete error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/translate')
async def translate_text(req: TranslateRequest, user: dict = Depends(get_current_user)):
    try:
        if not req.text.strip():
            return {'translated': ''}
            
        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{
                'role': 'system', 'content': 'You are a financial translator. Hinglish/Hindi to business English.'
            }, {
                'role': 'user', 'content': f'Translate: {req.text}'
            }],
        )
        translated = completion.choices[0].message.content.strip()
        return {'translated': translated}
    except Exception as e:
        logger.error(f'Translate error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ResolveRequest(BaseModel):
    ledger_entry: Optional[dict] = None
    flag_index: Optional[int] = None


@router.patch('/ledger/{entry_id}')
async def resolve_flag(entry_id: str, req: ResolveRequest, bg_tasks: BackgroundTasks, user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    try:
        from app.lib.cache import invalidate_health_cache, invalidate_insights_cache

        uid = user['uid']
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
        
        data = doc.to_dict()
        record_uid = data.get('uid')
        if record_uid and record_uid != uid:
            raise HTTPException(status_code=403, detail='Permission denied')
        if data.get('shop_id') != x_shop_id:
            raise HTTPException(status_code=403, detail='Permission denied (shop mismatch)')

        # Full entry update
        if req.ledger_entry:
            new_entry = req.ledger_entry
            new_entry['flags'] = [] 
            doc_ref.update({'ledger_entry': new_entry})
            bg_tasks.add_task(invalidate_health_cache, x_shop_id)
            bg_tasks.add_task(invalidate_insights_cache, x_shop_id)
            return {'message': 'Entry updated and flags cleared'}

        # Manual resolve by index
        if 'ledger_entry' in data and 'flags' in data['ledger_entry'] and req.flag_index is not None:
            flags = data['ledger_entry']['flags']
            if 0 <= req.flag_index < len(flags):
                flags.pop(req.flag_index)
                doc_ref.update({'ledger_entry': data['ledger_entry']})
                bg_tasks.add_task(invalidate_health_cache, x_shop_id)
                bg_tasks.add_task(invalidate_insights_cache, x_shop_id)
                return {'message': 'Flag resolved'}
        
        return {'message': 'No changes made'}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Resolve error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
