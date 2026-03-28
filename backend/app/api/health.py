from fastapi import APIRouter, HTTPException, Depends, Header
from app.lib.firebase_admin import db
from app.lib.auth_middleware import get_current_user
from app.ml.financial_health import compute_financial_health
import logging
import datetime

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/health-score')
async def get_health_score(user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    """
    Computes (or serves cached) financial health score for a shop.
    Cache TTL: 12 hours.
    """
    try:
        # 1. Check cache
        cache_ref = db.collection('shops').document(x_shop_id).collection('insights').document('health_score')
        cache_doc = cache_ref.get()

        if cache_doc.exists:
            cache_data = cache_doc.to_dict()
            computed_at = datetime.datetime.fromisoformat(cache_data['computed_at'])
            if (datetime.datetime.now() - computed_at).total_seconds() < (12 * 3600):
                logger.info(f"Serving cached health score for shop {x_shop_id}")
                return cache_data['result']

        # 2. Fetch ALL ledger entries for this shop (no date limit)
        docs = db.collection('ledger').where('shop_id', '==', x_shop_id).stream()

        entries = []
        for doc in docs:
            d = doc.to_dict()
            ledger = d.get('ledger_entry', {})
            entries.append({
                "earnings": ledger.get('earnings', 0) or 0,
                "expenses": ledger.get('expenses', []),
                "items_sold": ledger.get('items_sold', []),
                "flags": ledger.get('flags', []),
                "createdAt": d.get('createdAt', '')
            })

        # Sort by date ascending
        entries.sort(key=lambda e: e.get('createdAt', ''))

        # 3. Compute
        result = compute_financial_health(x_shop_id, entries)

        # 4. Cache
        cache_ref.set({
            "computed_at": datetime.datetime.now().isoformat(),
            "result": result
        })

        return result

    except Exception as e:
        logger.error(f"Health score error for shop {x_shop_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
