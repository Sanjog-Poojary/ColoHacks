from app.lib.firebase_admin import db

def list_mar29_docs(shop_id):
    docs = db.collection('ledger').where('shop_id', '==', shop_id).stream()
    found = False
    for d in docs:
        data = d.to_dict()
        if '2026-03-29' in data.get('createdAt', ''):
            earnings = data.get('ledger_entry', {}).get('earnings', 0) or 0
            print(f"ID: {d.id} | Earnings: {earnings} | CreatedAt: {data.get('createdAt')}")
            found = True
    if not found:
        print(f"No Mar 29 entries found for shop {shop_id}")

if __name__ == "__main__":
    list_mar29_docs('f351333e-e6ed-4e42-856a-b7a264f916e8')
