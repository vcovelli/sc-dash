import os
import pandas as pd
from pymongo import MongoClient
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

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

# Client specific schema config
CLIENT_NAME = os.getenv("CLIENT_NAME")
SCHEMA_PATH = BASE_DIR / "user_schemas" / f"{CLIENT_NAME}_schema.csv"

# Map schema CSV data types to pandas/Python
TYPE_MAP = {
    "INTEGER": "int64",
    "FLOAT": "float64",
    "TEXT": "object",
    "TIMESTAMP": "datetime64[ns]",
}

def transform_mongo_to_postgres():
    # Load schema
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema file not found: {SCHEMA_PATH}")
    schema_df = pd.read_csv(SCHEMA_PATH)
    expected_columns = schema_df['column_name'].str.lower().tolist()
    type_mapping = {row['column_name'].lower(): TYPE_MAP[row['data_type'].upper()] for _, row in schema_df.iterrows()}

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

    # Ensure all expected columns are present
    missing_cols = [col for col in expected_columns if col not in df.columns]
    if missing_cols:
        print(f"Missing expected columns in data: {missing_cols}")
        return
    
    # Subset and enforce types
    df = df[expected_columns]
    for col, dtype in type_mapping.items():
        try:
            df[col] = df[col].astype(dtype)
        except Exception as e:
            print(f"Type coercion failed for column '{col}': {e}")
            return

    # Connect to PostgreSQL
    engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}")

    # Insert transformed data into PostgreSQL
    df.to_sql(name=PROCESSED_TABLE, con=engine, if_exists='replace', index=False)

    print(f"Successfully loaded {len(df)} records into PostgreSQL ({PROCESSED_TABLE}).")

if __name__ == "__main__":
    transform_mongo_to_postgres()
