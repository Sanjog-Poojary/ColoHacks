import pandas as pd
from app.ml.normalizer import normalize_item_name
import unicodedata
from collections import Counter

def generate_business_insights(df: pd.DataFrame) -> list[str]:
    """
    Generates plain-language observations ('The Truth') about the business.
    Covers Earnings, Expenses, and Product Consistency.
    """
    if df.empty:
        return []
        
    insights = []
    
    # --- 1. Earnings Trend ---
    if 'earnings' in df.columns and len(df) >= 3:
        avg_earnings = df['earnings'].mean()
        recent_avg = df.iloc[-2:]['earnings'].mean() if len(df) >= 2 else df.iloc[-1:]['earnings'].mean()
        
        if recent_avg > avg_earnings * 1.2:
            insights.append(f"Business is picking up! Your recent earnings are {int((recent_avg/avg_earnings - 1) * 100)}% above your average.")
        elif recent_avg < avg_earnings * 0.8:
            insights.append("Earnings have slowed down recently compared to your usual average.")

    # --- 2. Expense Anomaly ---
    # Calculate daily expenses
    df['_daily_expenses'] = df['expenses'].apply(lambda exps: sum(e.get('amount', 0) or 0 for e in exps) if isinstance(exps, list) else 0)
    
    if len(df) >= 4:
        avg_expense = df['_daily_expenses'].iloc[:-1].mean()
        latest_expense = df['_daily_expenses'].iloc[-1]
        
        if latest_expense > avg_expense * 2 and latest_expense > 500:
            insights.append(f"High spending alert: Today's expenses (₹{int(latest_expense)}) were double your usual. Did you restock?")

    # --- 3. Consistency (The 'Truth' about items) ---
    item_counts = Counter()
    total_days = len(df)
    known_items = []
    
    for items in df['items_sold']:
        unique_today = set()
        for item in items:
            name = item.get('name', 'Unknown')
            # Apply same normalization as top_items.py
            _norm = unicodedata.normalize('NFC', name.lower().strip())
            if _norm in ['\u0906\u092e', 'aam']: name = 'Mango'
            elif _norm in ['\u0906\u0932\u0942', 'aloo']: name = 'Potato'
            elif _norm in ['\u091f\u092e\u093e\u091f\u0930', 'tamatar']: name = 'Tomato'
            
            canonical = normalize_item_name(name, known_items)
            unique_today.add(canonical)
        
        for name in unique_today:
            item_counts[name] += 1
            
    if item_counts:
        most_consistent, count = item_counts.most_common(1)[0]
        if count >= total_days * 0.7 and total_days >= 3:
            insights.append(f"{most_consistent} is your anchor — sold on {count} out of {total_days} recorded days.")

    # --- 4. Peak Day (Day of Week) ---
    if len(df) >= 7:
        df['day_name'] = df['date'].dt.day_name()
        day_avg = df.groupby('day_name')['earnings'].mean()
        best_day = day_avg.idxmax()
        insights.append(f"{best_day} is typically your strongest day for sales. Plan your stock accordingly.")

    # Remove temporary columns
    if '_daily_expenses' in df.columns:
        df.drop(columns=['_daily_expenses'], inplace=True)
    if 'day_name' in df.columns:
        df.drop(columns=['day_name'], inplace=True)

    return insights[:3] # Keep it punchy, max 3 observations
