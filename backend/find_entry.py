from app.lib.firebase_admin import db

def find_entry():
    docs = db.collection('ledger').stream()
    found = False
    for doc in docs:
        data = doc.to_dict()
        if '19992' in str(data):
            print(f"FOUND: ID={doc.id}, Shop={data.get('shop_id')}, Data={data}")
            found = True
    if not found:
        print("Entry ₹19992 not found in ledger.")

if __name__ == "__main__":
    find_entry()
