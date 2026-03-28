from fastapi import APIRouter, HTTPException, Query, Depends, Header
from pydantic import BaseModel
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
    try:
        uid = user['uid']
        seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        docs = (
            db.collection('ledger')
            .where('shop_id', '==', x_shop_id)
            .stream()
        )
        history = []
        for doc in docs:
            data = doc.to_dict()
            
            # Manual date filtering
            dt_str = data.get('createdAt')
            if not dt_str: continue
            
            dt = datetime.datetime.fromisoformat(dt_str)
            if dt < seven_days_ago: continue
            
            data['id'] = doc.id
            history.append(data)
        
        # Sort manually to avoid needing a Firestore composite index
        history.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return history
    except Exception as e:
        logger.error(f'History error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/ledger/{entry_id}')
async def delete_entry(entry_id: str, user: dict = Depends(get_current_user)):
    try:
        uid = user['uid']
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
        
        data = doc.to_dict()
        if data.get('uid') != uid:
            raise HTTPException(status_code=403, detail='Permission denied')
            
        doc_ref.delete()
        return {'message': 'Entry deleted successfully'}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Delete error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/translate')
async def translate_text(req: TranslateRequest):
    try:
        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{
                'role': 'user',
                'content': (
                    'Translate the following Hinglish/Hindi text to clear English. '
                    'Return ONLY the translated text, no explanations.\n\n'
                    f'Text: {req.text}'
                ),
            }],
        )
        translated = completion.choices[0].message.content.strip()
        return {'translated': translated}
    except Exception as e:
        logger.error(f'Translate error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch('/ledger/{entry_id}')
async def resolve_flag(entry_id: str, flag_index: int = Query(...), user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    try:
        uid = user['uid']
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
        
        data = doc.to_dict()
        if data.get('uid') != uid or data.get('shop_id') != x_shop_id:
            raise HTTPException(status_code=403, detail='Permission denied')

        if 'ledger_entry' in data and 'flags' in data['ledger_entry']:
            flags = data['ledger_entry']['flags']
            if 0 <= flag_index < len(flags):
                flags.pop(flag_index)
                doc_ref.update({'ledger_entry': data['ledger_entry']})
                return {'message': 'Flag resolved'}
        return {'message': 'No flags found'}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Resolve error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
