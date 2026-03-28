from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.lib.firebase_admin import db
from google.cloud.firestore_v1 import query as firestore_query
from groq import Groq
import os, json, logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))


class TranslateRequest(BaseModel):
    text: str


@router.get('/ledger')
async def get_ledger():
    try:
        docs = (
            db.collection('ledger')
            .order_by('createdAt', direction=firestore_query.Query.DESCENDING)
            .stream()
        )
        history = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            history.append(data)
        return history
    except Exception as e:
        logger.error(f'History error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/ledger/{entry_id}')
async def delete_entry(entry_id: str):
    try:
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')
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
async def resolve_flag(entry_id: str, flag_index: int = Query(...)):
    try:
        doc_ref = db.collection('ledger').document(entry_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail='Entry not found')

        data = doc.to_dict()
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