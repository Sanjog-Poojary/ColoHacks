from app.lib.firebase_admin import db

def find_active_caches():
    shops = db.collection('shops').stream()
    for s in shops:
        latest = s.reference.collection('insights').document('latest').get()
        if latest.exists:
            print(f"SHOP {s.id} HAS CACHE!")
            # print(latest.to_dict())

if __name__ == "__main__":
    find_active_caches()
