from fastapi import APIRouter, HTTPException, Depends, Header
from app.lib.firebase_admin import db
from app.lib.auth_middleware import get_current_user
import asyncio
import logging
import datetime
from app.ml.data_fetcher import fetch_vendor_entries
from app.ml.revenue_trend import compute_revenue_trend
from app.ml.top_items import compute_top_items
from app.ml.stock_suggestion import compute_stock_suggestions

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get('/insights')
async def get_insights(user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    """
    Retrieves business insights using a 100% local ML engine.
    > [!IMPORTANT]
    > Uses a 6-hour Firestore cache to minimize CPU usage while keeping data fresh.
    """
    try:
        # 1. Check Cache
        cache_ref = db.collection('shops').document(x_shop_id).collection('insights').document('latest')
        cache_doc = cache_ref.get()
        
        if cache_doc.exists:
            cache_data = cache_doc.to_dict()
            computed_at = datetime.datetime.fromisoformat(cache_data['computed_at'])
            # Temporarily checking for < 5 seconds so the AI rebuilds instantly upon Ledger deletes/edits!
            if (datetime.datetime.now() - computed_at).total_seconds() < 5:
                logger.info(f"Serving cached insights for shop {x_shop_id}")
                return cache_data['result']

        # 2. Fetch Data
        df = await fetch_vendor_entries(x_shop_id)
        
        if df.empty:
            # Check how many days recorded to show progress
            # (Simple count from 'ledger' collection)
            ledger_count = len(list(db.collection('ledger').where('shop_id', '==', x_shop_id).stream()))
            return {
                "status": "insufficient_data",
                "days_recorded": ledger_count
            }

        # 3. Run ML Models in Parallel (CPU-bound, use threads)
        # Using loop.run_in_executor for CPU-bound tasks
        loop = asyncio.get_event_loop()
        
        revenue_task = loop.run_in_executor(None, compute_revenue_trend, df)
        top_items_task = loop.run_in_executor(None, compute_top_items, df)
        stock_task = loop.run_in_executor(None, compute_stock_suggestions, df)
        
        revenue_trend, top_items, stock_suggestions = await asyncio.gather(
            revenue_task, top_items_task, stock_task
        )
        
        # 4. Calculate Aggregate Confidence Score (0-100)
        # R2 score (0 to 1) + Data quantity weight
        r2 = revenue_trend.get('confidence', 0)
        data_weight = min(len(df) / 14, 1.0) # Full weight at 14 days
        
        # Confidence = 70% R2, 30% Data Volume
        # Cap R2 at 0.95 for realistic reporting
        calc_score = (min(r2, 0.95) * 0.7 + data_weight * 0.3) * 100
        confidence_score = max(min(int(calc_score), 99), 40) # Keep between 40-99%

        result = {
            "status": "ok",
            "revenue_trend": revenue_trend,
            "top_items": top_items,
            "stock_suggestions": stock_suggestions,
            "trend_direction": revenue_trend.get('trend_direction', 'stable'),
            "confidence_score": confidence_score,
            "days_recorded": len(df),
            "computed_at": datetime.datetime.now().isoformat()
        }

        # 4. Save to Cache
        cache_ref.set({
            "computed_at": datetime.datetime.now().isoformat(),
            "result": result
        })

        return result

    except Exception as e:
        logger.error(f"Insights Error for shop {x_shop_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
