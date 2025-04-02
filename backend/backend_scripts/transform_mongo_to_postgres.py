import os
import pandas as pd
from pymongo import MongoClient
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the project root
env_path = Path("/home/vcovelli/projects/supply-chain-dashboard-2025/.env")
load_dotenv(dotenv_path=env_path, override=True)

# MongoDB Config (From .env)
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("MONGO_DATABASE")
RAW_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_RAW")

# PostgreSQL Config (From .env)
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_DATABASE = os.getenv("PG_DATABASE")
PROCESSED_TABLE = os.getenv("PG_TABLE_PROCESSED")

def transform_mongo_to_postgres():
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    raw_collection = db[RAW_COLLECTION_NAME]

    # Fetch raw data from MongoDB
    raw_data = list(raw_collection.find({}, {'_id': 0}))  # Exclude MongoDB's `_id` field
    if not raw_data:
        print("No data found in MongoDB.")
        return

    # Convert to Pandas DataFrame
    df = pd.DataFrame(raw_data)

    # Apply transformations HERE
    df.columns = df.columns.str.lower()

    # Connect to PostgreSQL
    engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}")

    # Insert transformed data into PostgreSQL
    df.to_sql(name=PROCESSED_TABLE, con=engine, if_exists='replace', index=False)

    print(f"Successfully loaded {len(df)} records into PostgreSQL ({PROCESSED_TABLE}).")

if __name__ == "__main__":
    transform_mongo_to_postgres()
