import os
import sys
import datetime
import random
import json

# Add root to sys.path to import app.lib
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.lib.firebase_admin import db

CATALOGS = {
    "FRUIT_VEGGIE": {
        "Apple": {"price": 120, "freq": 0.9},
        "Banana": {"price": 50, "freq": 0.8},
        "Potato": {"price": 30, "freq": 0.95},
        "Tomato": {"price": 40, "freq": 0.9},
        "Mango": {"price": 150, "freq": 0.4}
    },
    "FURNITURE": {
        "Chair": {"price": 450, "freq": 0.7},
        "Stool": {"price": 250, "freq": 0.8},
        "Table": {"price": 1200, "freq": 0.5},
        "Chowky": {"price": 150, "freq": 0.6},
        "Sofa": {"price": 8500, "freq": 0.1}
    },
    "GENERAL": {
        "Chai": {"price": 10, "freq": 1.0},
        "Samosa": {"price": 15, "freq": 0.8},
        "Vada Pav": {"price": 20, "freq": 0.6}
    }
}

def generate_demo_data(shop_id: str):
    """
    Auto-detects business type and generates 15 days of context-aware demo data.
    """
    print(f"🔍 Fetching Shop Profile: {shop_id}...")
    shop_ref = db.collection('shops').document(shop_id)
    shop_doc = shop_ref.get()
    
    if not shop_doc.exists:
        print(f"❌ Error: Shop ID {shop_id} not found in Firestore.")
        return
        
    s_data = shop_doc.to_dict()
    uid = s_data.get('uid')
    b_type = s_data.get('business_type', '').upper()
    
    # Pick catalog
    if "FRUIT" in b_type or "VEG" in b_type:
        catalog = CATALOGS["FRUIT_VEGGIE"]
        print("🥗 Mode: Fruit & Veggie")
    elif "FURNITURE" in b_type:
        catalog = CATALOGS["FURNITURE"]
        print("🪑 Mode: Furniture")
    else:
        catalog = CATALOGS["GENERAL"]
        print("🏪 Mode: General")
        
    start_date = datetime.datetime.now() - datetime.timedelta(days=15)
    
    for i in range(16):
        current_date = start_date + datetime.timedelta(days=i)
        growth_factor = 1.0 + (i / 10.0) # Growing by ~150%
        
        items_sold = []
        is_stock_out = (i == 13)
        stock_out_item = list(catalog.keys())[0]
        
        daily_earnings = 0
        for name, p_data in catalog.items():
            if random.random() < p_data['freq']:
                # Fuzzy matching noise
                display_name = name + "s" if (random.random() < 0.2) else name
                qty = int(random.randint(2, 10) * growth_factor)
                price = p_data['price']
                
                items_sold.append({
                    "name": display_name,
                    "qty": qty,
                    "price": price,
                    "is_anomalous": False
                })
                daily_earnings += (qty * price)
        
        # Transcript
        transcript = f"Aaj bohot bheed thi. Humne {len(items_sold)} items beche."
        if is_stock_out:
            transcript += f" Lekin shaam ko {stock_out_item} khatam hogaya tha."
            
        entry_data = {
            'transcript': transcript,
            'ledger_entry': {
                'items_sold': items_sold,
                'expenses': [{"label": "Transport", "amount": 50, "is_anomalous": False}],
                'earnings': daily_earnings,
                'flags': []
            },
            'createdAt': current_date.isoformat(),
            'filename': 'demo_recording.wav',
            'status': 'active',
            'shop_id': shop_id,
            'uid': uid
        }
        
        db.collection('ledger').add(entry_data)
        print(f"✅ Day {i}: {current_date.strftime('%Y-%m-%d')} - ₹{int(daily_earnings)} added.")

    print(f"\n✨ Done! {shop_id} is now populated with growing context-aware data.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/generate_demo_data.py <shop_id>")
        sys.exit(1)
    
    generate_demo_data(sys.argv[1])
