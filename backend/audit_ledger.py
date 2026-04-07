from app.lib.firebase_admin import db
import sys

def audit_shop(shop_id):
    docs = db.collection('ledger').where('shop_id', '==', shop_id).stream()
    total = 0
    entries = []
    for d in docs:
        data = d.to_dict()
        ledger = data.get('ledger_entry', {})
        earnings = ledger.get('earnings', 0) or 0
        total += earnings
        entries.append({
            'id': d.id,
            'earnings': earnings,
            'createdAt': data.get('createdAt')
        })
    print(f"Shop: {shop_id}")
    print(f"Total Ledger Earnings: {total}")
    print("Entries:")
    for e in entries:
        print(f"  ID: {e['id']}, Earnings: {e['earnings']}, Date: {e['createdAt']}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        audit_shop(sys.argv[1])
    else:
        print("Usage: python audit_ledger.py <shop_id>")
