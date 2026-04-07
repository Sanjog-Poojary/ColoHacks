from app.lib.firebase_admin import db

def find_shop_with_data():
    docs = db.collection('ledger').stream()
    shops_with_mar29 = set()
    for d in docs:
        data = d.to_dict()
        if '2026-03-29' in data.get('createdAt', ''):
            shops_with_mar29.add(data.get('shop_id'))
    
    print(f"Shops with data on Mar 29: {list(shops_with_mar29)}")

if __name__ == "__main__":
    find_shop_with_data()
