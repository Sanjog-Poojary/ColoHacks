from app.lib.firebase_admin import db

def check_mar29_entries(shop_id):
    docs = db.collection('ledger').where('shop_id', '==', shop_id).stream()
    total = 0
    found = False
    for d in docs:
        data = d.to_dict()
        created_at = data.get('createdAt', '')
        if '2026-03-29' in created_at:
            earnings = data.get('ledger_entry', {}).get('earnings', 0) or 0
            total += earnings
            print(f"FOUND: {d.id} | Date: {created_at} | Earnings: {earnings}")
            found = True
    
    # Also check shop_id=None because some records might be missing it
    docs_none = db.collection('ledger').where('shop_id', '==', None).stream()
    for d in docs_none:
        data = d.to_dict()
        created_at = data.get('createdAt', '')
        if '2026-03-29' in created_at:
            earnings = data.get('ledger_entry', {}).get('earnings', 0) or 0
            total += earnings
            print(f"FOUND (NONE): {d.id} | Date: {created_at} | Earnings: {earnings}")
            found = True
            
    print(f"Total Earnings calculated for Mar 29: {total}")

if __name__ == "__main__":
    check_mar29_entries('08fe9ada-1e2a-4af7-b2be-dcca8b9706fc')
