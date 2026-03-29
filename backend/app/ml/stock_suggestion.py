import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from app.ml.normalizer import normalize_item_name
import math
import logging

logger = logging.getLogger(__name__)

# Canonical unit map — keyed by lowercase item name fragments
# The engine picks the FIRST key that is a substring of the canonical item name.
KNOWN_UNITS: dict[str, str] = {
    "apple": "kg",
    "mango": "kg",
    "banana": "dozen",
    "potato": "kg",
    "onion": "kg",
    "tomato": "kg",
    "milk": "litre",
    "bread": "piece",
    "egg": "piece",
    "chai": "cup",
    "samosa": "piece",
    "vada pav": "piece",
    "chair": "piece",
    "stool": "piece",
    "table": "piece",
    "chowky": "piece",
    "sofa": "piece",
}

def _resolve_unit(item_name: str, ledger_unit: str | None) -> str:
    """Returns the best unit for an item — prefers the unit stored in the ledger,
    falls back to the KNOWN_UNITS map, then defaults to 'kg'."""
    if ledger_unit and ledger_unit.strip():
        return ledger_unit.strip()
    lower = item_name.lower()
    # 1. Try exact word match for more accuracy
    import re
    for key, unit in KNOWN_UNITS.items():
        if re.search(rf'\b{key}\b', lower):
            return unit
    # 2. Fallback to substring if no word boundary found
    for key, unit in KNOWN_UNITS.items():
        if key in lower:
            return unit
    return "kg"  # sensible default for a market vendor

def compute_stock_suggestions(df: pd.DataFrame) -> list[dict]:
    """
    Fits ExponentialSmoothing per item and forecasts 1 step ahead.
    > [!IMPORTANT]
    > Adds a 15% buffer if 'stock out' phrases are detected in raw transcripts.
    """
    if df.empty or 'items_sold' not in df.columns:
        return []
        
    known_items = []
    daily_qty: dict[str, list] = {}  # canonical name -> daily quantities
    item_units: dict[str, str] = {}  # canonical name -> best known unit
    
    # Keyword scanning in raw transcripts for stock-out detection
    stock_out_keywords = ["khatam", "ran out", "stock nahi", "nahi tha", "sold out", "finish hogaya"]
    
    # Dates to loop through daily
    dates = df['date'].dt.date.unique()
    
    # a. Build Time Series per Item
    for date in dates:
        day_entries = df[df['date'].dt.date == date]
        day_items: dict[str, float] = {}
        
        for index, row in day_entries.iterrows():
            for item in row['items_sold']:
                name = item.get('name', 'Unknown')
                qty = float(item.get('qty', 0))
                ledger_unit = item.get('unit', None)  # unit stored in ledger entry
                
                canonical = normalize_item_name(name, known_items)
                day_items[canonical] = day_items.get(canonical, 0) + qty
                
                # Persist unit — first seen wins
                if canonical not in item_units:
                    item_units[canonical] = _resolve_unit(canonical, ledger_unit)
                
        # Update daily_qty for all known items
        for canonical in known_items:
            if canonical not in daily_qty:
                daily_qty[canonical] = []
            daily_qty[canonical].append(day_items.get(canonical, 0))
            
    suggestions = []
    # Limit to top 5 items by total frequency to avoid excessive computation
    top_items = sorted(daily_qty.keys(), key=lambda k: sum(q > 0 for q in daily_qty[k]), reverse=True)[:5]
    
    for item in top_items:
        series = daily_qty[item]
        
        # Check stock-out phrases in entire history for this specific item
        # In a real app, this would be more granular, but for now we scan all transcripts
        # where this item appeared
        item_transcripts = " ".join(df[df['items_sold'].apply(lambda x: any(normalize_item_name(i.get('name',''), known_items) == item for i in x))]['transcript'])
        has_stockout_issue = any(k in item_transcripts.lower() for k in stock_out_keywords)
        
        # b. Fit ExponentialSmoothing (statsmodels)
        # Using simple trend="add" for forecasting
        try:
            # Statsmodels needs at least 2 data points with trend
            if len([q for q in series if q > 0]) < 2:
                prediction = sum(series) / len(series) # Fallback to simple avg
            else:
                model = ExponentialSmoothing(
                    series, 
                    trend="add", 
                    seasonal=None, 
                    initialization_method="estimated"
                )
                fit = model.fit()
                prediction = fit.forecast(1)[0]
        except Exception:
            # Final fallback
            prediction = sum(series) / len(series)
            
        prediction = max(0, prediction) # No negative stock
        
        # c. Apply Buffer Logic
        reason = f"Sold avg {round(sum(series)/len(series), 1)}/day this week."
        if has_stockout_issue:
            prediction *= 1.15
            reason = f"Ran out recently — stocking 15% extra."
            
        # d. Round up to nearest unit
        suggested_qty = math.ceil(prediction)
        # Add 1 as a safety base if suggested_qty is 0
        if suggested_qty == 0 and sum(series) > 0:
            suggested_qty = 1
            
        suggestions.append({
            "item": item,
            "suggested_qty": int(suggested_qty),
            "reason": reason,
            "has_buffer": has_stockout_issue,
            "unit": item_units.get(item, _resolve_unit(item, None))
        })
        
    return suggestions
