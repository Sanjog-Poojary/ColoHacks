from app.lib.firebase_admin import db
import datetime

def audit_today():
    today = "2026-03-30"
    docs = db.collection('ledger').stream()
    found = False
    for d in docs:
        data = d.to_dict()
        if today in data.get('createdAt', ''):
            print(f"ID: {d.id} | Shop: {data.get('shop_id')} | Earnings: {data.get('ledger_entry', {}).get('earnings')}")
            found = True
    if not found:
        print(f"No records found for today {today}")

if __name__ == "__main__":
    audit_today()
