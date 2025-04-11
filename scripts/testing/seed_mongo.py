from pymongo import MongoClient

def seed_data():
    client = MongoClient("mongodb://mongo:27017/")
    db = client["supply_chain_raw"]
    collection = db["products"]

    sample_docs = [
        {"product_id": 1, "name": "Widget A", "quantity": 100, "location": "Warehouse 1"},
        {"product_id": 2, "name": "Widget B", "quantity": 200, "location": "Warehouse 2"},
    ]

    collection.insert_many(sample_docs)
    print("Sample MongoDB data inserted.")

if __name__ == "__main__":
    seed_data()
