from fastapi import APIRouter, HTTPException, Depends, Header
from app.lib.firebase_admin import db
from app.lib.auth_middleware import get_current_user
from groq import Groq
import os, json, logging, datetime
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
@router.get('/insights')
async def get_insights(user: dict = Depends(get_current_user), x_shop_id: str = Header(...)):
    """
    Generates business intelligence using a hybrid statistical + AI approach.
    
    1. **Data Gathering**: Fetches the last 7 days of ledger items.
    2. **Statistical Anomaly Detection**:
       - Calculates average daily earnings across the window.
       - Flags high variance (e.g., current day > 2x average) for immediate feedback.
    3. **LLM Pattern Recognition**:
       - Sends the raw ledger data to Groq Llama 3.3.
       - Extracts bestsellers, slow-moving items, and strategic advice.
    
    Returns: Chart data, AI insights, weekly totals, and urgent alerts.
    """
    try:
        uid = user['uid']
        seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        docs = (
            db.collection('ledger')
            .where('shop_id', '==', x_shop_id)
            .stream()
        )
        raw_data = []
        daily_earnings = {}
        for doc in docs:
            data = doc.to_dict()
            
            # Manual date filtering
            dt_str = data.get('createdAt')
            if not dt_str: continue
            
            dt = datetime.datetime.fromisoformat(dt_str)
            if dt < seven_days_ago: continue
            
            raw_data.append(data)
            dt = data.get('createdAt')
            if isinstance(dt, str): dt = datetime.datetime.fromisoformat(dt)
            if isinstance(dt, datetime.datetime):
                date_str = dt.strftime('%Y-%m-%d')
                daily_earnings[date_str] = daily_earnings.get(date_str, 0) + data['ledger_entry']['earnings']
        
        if not raw_data:
             return {
                 'chart_data': [],
                 'insights': {'bestseller': '-', 'slow_item': '-', 'suggestion': 'No data available yet. Record your first sale!'},
                 'weekly_total': 0,
                 'alert': None
             }
        
        # Anomaly Detection Logic
        avg_earnings = sum(daily_earnings.values()) / len(daily_earnings)
        latest_date = sorted(daily_earnings.keys())[-1]
        latest_earnings = daily_earnings[latest_date]
        
        alert = None
        if latest_earnings > 2 * avg_earnings:
            alert = 'Your sales today are more than double your average! What happened?'
        elif latest_earnings < 0.5 * avg_earnings and len(daily_earnings) > 2:
            alert = 'Sales are unusually low today compared to your weekly average.'

        prompt = f'Given the following weekly business narration data: {json.dumps(raw_data[:20])}. Identify the bestseller, any slow items, and give a 1-sentence suggestion for the vendor to improve sales tomorrow. Respond in JSON with keys: bestseller, slow_item, suggestion.'
        completion = groq_client.chat.completions.create(model='llama-3.3-70b-versatile', messages=[{'role': 'user', 'content': prompt}], response_format={'type': 'json_object'})
        insights = json.loads(completion.choices[0].message.content)
        chart_data = [{'date': d, 'earnings': e} for d, e in sorted(daily_earnings.items())]
        return {
            'chart_data': chart_data, 
            'insights': insights, 
            'weekly_total': sum(daily_earnings.values()),
            'alert': alert
        }
    except Exception as e:
        logger.error(f'Insights error: {str(e)}', exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

