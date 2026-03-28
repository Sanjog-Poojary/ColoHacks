import pandas as pd
from app.lib.firebase_admin import db
import datetime
import logging

logger = logging.getLogger(__name__)

async def fetch_vendor_entries(shop_id: str) -> pd.DataFrame:
    """
    Retrieves all ledger entries for a shop and converts them into a Pandas DataFrame.
    > [!IMPORTANT]
    > Requires at least 4 rows of data with valid earnings to be useful for ML models.
    """
    try:
        # Fetch from 'ledger' collection (based on existing schema)
        docs = (
            db.collection('ledger')
            .where('shop_id', '==', shop_id)
            .stream()
        )
        
        data_list = []
        for doc in docs:
            d = doc.to_dict()
            entry_date = d.get('createdAt')
            if not entry_date: continue
            
            # Extract structured data
            ledger = d.get('ledger_entry', {})
            earnings = ledger.get('earnings', 0)
            
            # Skip if no earnings (per prompt requirement)
            if earnings is None or earnings == 0: continue
            
            data_list.append({
                'date': pd.to_datetime(entry_date),
                'earnings': float(earnings),
                'items_sold': ledger.get('items_sold', []),
                'expenses': ledger.get('expenses', []),
                'transcript': d.get('transcript', '') # Needed for stock-out buffers
            })
            
        if not data_list:
            return pd.DataFrame()
            
        df = pd.DataFrame(data_list)
        df = df.sort_values('date').reset_index(drop=True)
        
        # Aggregate by date (YYYY-MM-DD) to ensure one row per day
        df['date_only'] = df['date'].dt.date
        agg_df = df.groupby('date_only').agg({
            'earnings': 'sum',
            'items_sold': 'sum', # List concatenation
            'expenses': 'sum',
            'transcript': ' '.join
        }).reset_index()
        
        agg_df.rename(columns={'date_only': 'date'}, inplace=True)
        agg_df['date'] = pd.to_datetime(agg_df['date'])
        
        # Minimum threshold check
        if len(agg_df) < 4:
            logger.warning(f"Insufficient data for shop {shop_id}: {len(agg_df)} days")
            return pd.DataFrame() # Signal insufficient data
            
        return agg_df

    except Exception as e:
        logger.error(f"Error fetching data for shop {shop_id}: {str(e)}")
        return pd.DataFrame()
