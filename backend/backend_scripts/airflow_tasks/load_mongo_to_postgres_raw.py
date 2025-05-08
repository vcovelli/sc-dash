import os
import sys
import pandas as pd
from pymongo import MongoClient
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load .env file from the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

MONGO_URI = os.getenv("MONGO_URI")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_DATABASE = os.getenv("PG_DATABASE")
PG_DB_PREFIX = os.getenv("PG_DB_PREFIX", "clientdata_")
RAW_COLLECTION = "raw_data"
RAW_TABLE = "raw_orders"

def create_client_database(client_name):
    db_name = f"{PG_DB_PREFIX}{client_name}"
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        if not cur.fetchone():
            cur.execute(f"CREATE DATABASE {db_name}")
            print(f"[+] Created Postgres DB: {db_name}")
        else:
            print(f"[=] Postgres DB already exists: {db_name}")

        cur.close()
        conn.close()
        return db_name
    except Exception as e:
        print(f"[!] Error creating DB '{db_name}': {e}")
        return None

def load_mongo_to_postgres_raw():
    try:
        client = MongoClient(MONGO_URI)
        db_names = client.list_database_names()
    except Exception as e:
        print(f"[!] Error connecting to MongoDB: {e}")
        return

    for db_name in db_names:
        db = client[db_name]
        if RAW_COLLECTION not in db.list_collection_names():
            continue

        collection = db[RAW_COLLECTION]
        raw_data = list(collection.find({}, {'_id': 0}))
        if not raw_data:
            print(f"[=] No data in {db_name}.{RAW_COLLECTION}")
            continue

        df = pd.DataFrame(raw_data)
        df.columns = df.columns.str.lower()
        df["ingested_at"] = datetime.now(timezone.utc)
        df["client_name"] = db_name

        target_pg_db = create_client_database(db_name)
        if not target_pg_db:
            continue

        try:
            engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{target_pg_db}")
            df.to_sql(name=RAW_TABLE, con=engine, if_exists='append', index=False)
            print(f"[✓] Inserted {len(df)} rows into {target_pg_db}.{RAW_TABLE}")
        except Exception as e:
            print(f"[!] Failed to insert into Postgres DB '{target_pg_db}': {e}")

if __name__ == "__main__":
    load_mongo_to_postgres_raw()
