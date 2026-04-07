from app.lib.firebase_admin import db
import datetime

def test_history_logic(shop_id, uid):
    print(f"Testing history logic for Shop: {shop_id}, User: {uid}")
    
    # Simulating the NEW logic in history.py
    docs = (
        db.collection('ledger')
        .where('shop_id', '==', shop_id)
        .where('uid', '==', uid)
        .stream()
    )
    
    history = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        history.append(data)
    
    history.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    
    print(f"Found {len(history)} entries.")
    for h in history:
        print(f"- ID: {h['id']}, Date: {h.get('createdAt')}, Items: {len(h.get('ledger_entry', {}).get('items_sold', []))}")

if __name__ == "__main__":
    # From find_shop_data.py we know this shop has data
    SHOP_ID = "6cc12d61-4401-93bf-6aacaa4436a6"
    # We need to find the UID for this shop's data
    docs = db.collection('ledger').where('shop_id', '==', SHOP_ID).limit(1).get()
    if docs:
        uid = docs[0].to_dict().get('uid')
        test_history_logic(SHOP_ID, uid)
    else:
        print("No data found for this shop to test with.")
