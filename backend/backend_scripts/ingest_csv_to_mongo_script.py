import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the project root
env_path = Path("/home/vcovelli/projects/supply-chain-dashboard-2025/.env")
load_dotenv(dotenv_path=env_path, override=True)

# MongoDB Config
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("MONGO_DATABASE")
RAW_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_RAW")

def ingest_csv_to_mongo():
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[RAW_COLLECTION_NAME]

    # CSV File Path (Hardcoded for now, modify if needed)
    csv_file = os.getenv("CSV_FILE_PATH")

    if not os.path.exists(csv_file):
        print(f"CSV file not found: {csv_file}")
        return

    # Read CSV into Pandas DataFrame
    df = pd.read_csv(csv_file)

    # Convert DataFrame to Dictionary Format
    data = df.to_dict(orient="records")

    if data:
        collection.insert_many(data)
        print(f"Successfully inserted {len(data)} records into MongoDB.")
    else:
        print("No data found in CSV file.")

if __name__ == "__main__":
    ingest_csv_to_mongo()
