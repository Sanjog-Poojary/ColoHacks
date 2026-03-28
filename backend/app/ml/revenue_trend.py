import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import datetime
import logging

logger = logging.getLogger(__name__)

def compute_revenue_trend(df: pd.DataFrame) -> dict:
    """
    Computes a 7-day rolling average and forecasts the next 7 days using Linear Regression.
    > [!IMPORTANT]
    > Returns a trend_direction of 'growing', 'declining', or 'stable' based on the slope.
    """
    if df.empty or 'earnings' not in df.columns:
        return {}
        
    df['rolling_avg'] = df['earnings'].rolling(window=7, min_periods=1).mean()
    X = np.arange(len(df)).reshape(-1, 1)
    y = df['earnings'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    slope = model.coef_[0]
    preds = model.predict(X)
    r2 = r2_score(y, preds)
    
    future_X = np.arange(len(df), len(df) + 7).reshape(-1, 1)
    future_preds = model.predict(future_X)
    
    last_date = df['date'].max()
    forecast_dates = [last_date + datetime.timedelta(days=i) for i in range(1, 8)]
    
    forecast = [
        {"date": d.strftime('%Y-%m-%d'), "predicted_earnings": round(float(p), 2)} 
        for d, p in zip(forecast_dates, future_preds)
    ]
    
    historical = [
        {
            "date": d.strftime('%Y-%m-%d'),
            "earnings": float(e),
            "rolling_avg": round(float(ra), 2)
        }
        for d, e, ra in zip(df['date'], df['earnings'], df['rolling_avg'])
    ]
    
    if slope > 50:
        trend_direction = "growing"
    elif slope < -50:
        trend_direction = "declining"
    else:
        trend_direction = "stable"
        
    return {
        "historical": historical,
        "forecast": forecast,
        "trend_direction": trend_direction,
        "slope": round(float(slope), 2),
        "confidence": round(float(r2), 4)
    }
