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
    """
    Retrieves the last 7 days of ledger history for a specific shop.
    Supports manual filtering and sorting to minimize Firestore index requirements.
    """
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
    """
    Deletes a specific ledger entry after verifying user ownership.
    """
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
async def translate_text(req: TranslateRequest, user: dict = Depends(get_current_user)):
    """
    Translates Hinglish voice notes into professional business English using Llama 3.3.
    Uses strict rules to distinguish between currency amounts and item counts.
    > [!IMPORTANT]
    > The model is instructed to treat 'Jama' as 'Credit' and 'Udhaar/Naave' as 'Debit'.
    """
    try:
        if not req.text.strip():
            return {'translated': ''}
            
        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{
                'role': 'system',
                'content': (
                    'You are an expert financial translator for VyapaarVaani, '
                    'a business ledger app for small Indian shops. '
                    'Translate Hinglish/Hindi narration into professional English business entries.\n\n'
                    'STRICT RULES:\n'
                    '1. NEVER combine disparate numbers (e.g., "200 Mangoes, sold for 40" must NOT become "240 mangoes").\n'
                    '2. Distinguish between Item Quantity and Currency Amount.\n'
                    '3. Contextualize "Jama" as "Credit" and "Udhaar/Naave" as "Debit".\n'
                    '4. Return ONLY the translated English sentence. No intro, no "Sure," no explanations.'
                )
            }, {
                'role': 'user',
                'content': f'Translate: {req.text}'
            }],
        )
        translated = completion.choices[0].message.content.strip()
        # Remove common model conversational prefixes if they persist
        prefixes = ['translation:', 'here is the translation:', 'Sure, ', 'translated:']
        for p in prefixes:
            if translated.lower().startswith(p):
                translated = translated[len(p):].strip()
        
        return {'translated': translated}
    except Exception as e:
        logger.error(f'Translate error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


from pydantic import BaseModel
from typing import Optional

class ResolveRequest(BaseModel):
    ledger_entry: Optional[dict] = None
    flag_index: Optional[int] = None


@router.patch('/ledger/{entry_id}')
async def resolve_flag(entry_id: str, req: ResolveRequest, user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    """
    Resolves discrepancies in a ledger entry.
    > [!NOTE]
    > Two flows supported:
    > - **Scenario A**: Full ledger_entry update (clears all flags).
    > - **Scenario B**: Manual index-based flag removal.
    """
    try:
        uid = user['uid']
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
        
        data = doc.to_dict()
        if data.get('uid') != uid or data.get('shop_id') != x_shop_id:
            raise HTTPException(status_code=403, detail='Permission denied')

        # Scenario A: Full entry update (New Flow)
        if req.ledger_entry:
            new_entry = req.ledger_entry
            new_entry['flags'] = [] # Clear all flags once user clarifies
            doc_ref.update({'ledger_entry': new_entry})
            return {'message': 'Entry updated and flags cleared'}

        # Scenario B: Manual Resolve by index (Old Flow)
        if 'ledger_entry' in data and 'flags' in data['ledger_entry'] and req.flag_index is not None:
            flags = data['ledger_entry']['flags']
            if 0 <= req.flag_index < len(flags):
                flags.pop(req.flag_index)
                doc_ref.update({'ledger_entry': data['ledger_entry']})
                return {'message': 'Flag resolved'}
        
        return {'message': 'No changes made'}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f'Resolve error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
