import pandas as pd
from app.ml.normalizer import normalize_item_name
import logging

logger = logging.getLogger(__name__)

def compute_top_items(df: pd.DataFrame) -> list[dict]:
    """
    Ranks products by sales frequency and total quantity sold.
    > [!NOTE]
    > Uses fuzzy matching to group similar product names during aggregation.
    """
    if df.empty or 'items_sold' not in df.columns:
        return []
        
    known_items = []
    item_stats = {}
    
    # a. Flatten All Items Sold across all entries
    for index, row in df.iterrows():
        # Track items seen on this specific day to avoid double-counting frequency
        unique_items_today = set()
        
        for item in row['items_sold']:
            name = item.get('name', 'Unknown')
            qty = float(item.get('qty', 1))
            price = float(item.get('price', 0))
            
            # Redundant Failsafe: Force priority translations
            import unicodedata
            _norm = unicodedata.normalize('NFC', name.lower().strip())
            if _norm in ['\u0906\u092e', 'aam']: name = 'Mango'
            elif _norm in ['\u0906\u0932\u0942', 'aloo']: name = 'Potato'
            elif _norm in ['\u091f\u092e\u093e\u091f\u0930', 'tamatar']: name = 'Tomato'
            elif _norm in ['\u0915\u0947\u0932\u093e', 'kela']: name = 'Banana'
            elif _norm in ['\u0938\u0947\u092c', 'seb']: name = 'Apple'
            elif _norm in ['\u092a\u094d\u092f\u093e\u091c', 'pyaz']: name = 'Onion'
            
            # b. Run each item name through normalize_item_name
            canonical = normalize_item_name(name, known_items)
            
            if canonical not in item_stats:
                item_stats[canonical] = {
                    'name': canonical,
                    'days_sold': 0,
                    'total_qty': 0,
                    'total_revenue': 0
                }
            
            item_stats[canonical]['total_qty'] += qty
            item_stats[canonical]['total_revenue'] += (qty * price)
            unique_items_today.add(canonical)
            
        # Update day count
        for canonical in unique_items_today:
            item_stats[canonical]['days_sold'] += 1
            
    # c. Rank by Revenue primarily, then Frequency as tiebreaker
    sorted_items = sorted(
        item_stats.values(), 
        key=lambda x: (x['total_revenue'], x['days_sold']), 
        reverse=True
    )
    
    # d. Return Top 5
    # Rounding for clean JSON
    for item in sorted_items:
        item['total_qty'] = round(item['total_qty'], 2)
        item['total_revenue'] = round(item['total_revenue'], 2)
        
    return sorted_items[:5]
