"""
Cache invalidation helpers.
Shared utilities for busting Firestore caches when data changes.
"""
from app.lib.firebase_admin import db
import logging

logger = logging.getLogger(__name__)


def invalidate_health_cache(shop_id: str):
    """
    Delete the cached health score for a shop so it is recomputed on next request.
    Designed to be called as a BackgroundTask — never blocks the main response.
    """
    try:
        ref = db.collection('shops').document(shop_id).collection('insights').document('health_score')
        ref.delete()
        logger.info(f"Health cache invalidated for shop {shop_id}")
    except Exception as e:
        logger.error(f"Failed to invalidate health cache for {shop_id}: {e}")


def invalidate_insights_cache(shop_id: str):
    """
    Delete the cached insights for a shop so it is recomputed on next request.
    """
    try:
        ref = db.collection('shops').document(shop_id).collection('insights').document('latest')
        ref.delete()
        logger.info(f"Insights cache invalidated for shop {shop_id}")
    except Exception as e:
        logger.error(f"Failed to invalidate insights cache for {shop_id}: {e}")
