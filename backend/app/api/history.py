from fastapi import APIRouter, HTTPException, Query
from app.lib.firebase_admin import db
from google.cloud.firestore_v1 import query as firestore_query
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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