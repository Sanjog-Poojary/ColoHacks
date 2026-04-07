from app.lib.firebase_admin import db

def check_none():
    docs = db.collection('ledger').stream()
    total = 0
    count = 0
    for doc in docs:
        data = doc.to_dict()
        if data.get('shop_id') is None:
            ledger = data.get('ledger_entry', {})
            earnings = ledger.get('earnings', 0) or 0
            total += earnings
            count += 1
    print(f"Total Ledger Earnings for shop_id=None: {total} ({count} documents)")

if __name__ == "__main__":
    check_none()
