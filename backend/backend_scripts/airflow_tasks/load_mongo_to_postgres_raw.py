import os
import sys
import uuid
import pandas as pd
from pymongo import MongoClient
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load .env file from the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

MONGO_URI = os.getenv("MONGO_URI")
PG_USER = os.getenv("APP_DB_USER")
PG_PASSWORD = os.getenv("APP_DB_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_DATABASE = os.getenv("PG_DATABASE")
PG_DB_PREFIX = os.getenv("PG_DB_PREFIX", "clientdata_")
RAW_COLLECTION = "raw_data"
RAW_TABLE = "raw_orders"
LOG_TABLE = "raw_orders_log"

# Load user-defined schema utility
def load_user_schema_columns(client_name):
    schema_dir = os.environ.get("SCHEMA_DIR", "/opt/airflow/user_schemas")
    schema_path = Path(schema_dir) / f"{client_name.lower()}_schema.csv"
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    import csv
    with open(schema_path, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        columns = [(row['column_name'], row['data_type']) for row in reader]

    dedup_keys = {
        'order_id': 'TEXT',
        'product_id': 'TEXT',
        'order_date': 'DATE',
        'ingested_at': 'TIMESTAMP WITH TIME ZONE',
        'version': 'INT',
        'composite_key': 'TEXT'
    }
    for key, dtype in dedup_keys.items():
        if key not in [col[0] for col in columns]:
            columns.append((key, dtype))

    return columns

# Database creation utility
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

def load_mongo_to_postgres_raw(**context):
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
        raw_data = list(collection.find({"postgres_status": {"$ne": "ingested"}}))

        if not raw_data:
            print(f"[=] No new data in {db_name}.{RAW_COLLECTION}")
            continue

        # Assign UUIDs and mark ingest status
        for row in raw_data:
            row['uuid'] = str(uuid.uuid4())
            row['ingested_at'] = datetime.now(timezone.utc)
            row['client_name'] = db_name

        # Extract Mongo _ids before dropping them
        mongo_ids = [row["_id"] for row in raw_data]
        # Drop '_id' field for Postgres but keep in memory
        for row in raw_data:
            row.pop('_id', None)

        # Add composite_key to each row
        for row in raw_data:
            if "order_id" in row and "product_name" in row:
                row["composite_key"] = f"{row['order_id']}_{row['product_name']}"
            else:
                row["composite_key"] = None

        # Convert to DataFrame
        df = pd.DataFrame(raw_data)
        df.columns = df.columns.str.lower()
        df["client_name"] = db_name

        if "composite_key" not in df.columns:
            if "order_id" in df.columns and "product_name" in df.columns:
                df["composite_key"] = df["order_id"].astype(str) + "_" + df["product_name"].astype(str)
            else:
                raise ValueError("Missing 'order_id' or 'product_name' column needed for composite_key.")

        # Ensure required deduplication columns exist
        required_keys = ['order_id', 'product_id', 'order_date', 'ingested_at', 'version', 'composite_key']
        for col in required_keys:
            if col not in df.columns:
                if col == 'version':
                    df[col] = 1
                elif col == 'ingested_at':
                    df[col] = datetime.now(timezone.utc)
                else:
                    df[col] = None

        target_pg_db = create_client_database(db_name)
        if not target_pg_db:
            continue

        try:
            engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{target_pg_db}")
            schema_columns = load_user_schema_columns(db_name)
            expected_columns = [name for name, _ in schema_columns]

            missing_cols = set(expected_columns) - set(df.columns)
            if missing_cols:
                raise ValueError(f"Missing columns in DataFrame before reindexing: {missing_cols}")
            df = df.reindex(columns=expected_columns)

            with engine.connect() as conn:
                table_check = conn.execute(text(
                    f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{RAW_TABLE}');"
                )).scalar()

                if not table_check:
                    print(f"[+] Creating table {RAW_TABLE} from schema...")
                    col_defs = ",\n".join([f"{name} {dtype}" for name, dtype in schema_columns])
                    pk_def = "PRIMARY KEY (order_id, product_id, order_date, ingested_at, version)"
                    create_stmt = f"""
                    CREATE TABLE {RAW_TABLE} (
                        {col_defs},
                        {pk_def}
                    );
                    """
                    conn.execute(text(create_stmt))
                    conn.execute(text(
                        f"CREATE INDEX IF NOT EXISTS idx_{RAW_TABLE}_composite_key ON {RAW_TABLE} (composite_key);"
                    ))

                    # Create log table
                    conn.execute(text(f"""
                        CREATE TABLE IF NOT EXISTS {LOG_TABLE} (
                            composite_key TEXT,
                            old_version INT,
                            new_version INT,
                            change_timestamp TIMESTAMPTZ DEFAULT now(),
                            changed_by TEXT DEFAULT 'auto-pipeline'
                        );
                    """))
                else:
                    print(f"[=] Table {RAW_TABLE} already exists. Skipping creation.")

                # Detect existing composite keys and max versions
                existing = conn.execute(text(
                    f"SELECT composite_key, MAX(version) as max_version FROM {RAW_TABLE} GROUP BY composite_key"
                )).fetchall()
                existing_map = {row[0]: row[1] for row in existing}

                rows_to_insert = []
                logs_to_insert = []
                for _, row in df.iterrows():
                    comp_key = row['composite_key']
                    if comp_key in existing_map:
                        current_version = existing_map[comp_key]
                        row['version'] = current_version + 1
                        logs_to_insert.append({
                            'composite_key': comp_key,
                            'old_version': current_version,
                            'new_version': row['version'],
                        })
                    else:
                        row['version'] = 1
                    rows_to_insert.append(row)

                insert_df = pd.DataFrame(rows_to_insert)
                insert_df.to_sql(name=RAW_TABLE, con=engine, if_exists='append', index=False, method='multi')
                print(f"[✓] Inserted {len(insert_df)} rows into {target_pg_db}.{RAW_TABLE}")

                if logs_to_insert:
                    log_df = pd.DataFrame(logs_to_insert)
                    log_df["change_timestamp"] = datetime.now(timezone.utc)
                    log_df["changed_by"] = "auto-pipeline"
                    log_df.to_sql(name=LOG_TABLE, con=engine, if_exists='append', index=False, method='multi')
                    print(f"[✓] Logged {len(logs_to_insert)} version changes to {LOG_TABLE}")

                # Only mark as ingested if Postgres insert succeeded
                for row, mongo_id in zip(raw_data, mongo_ids):
                    collection.update_one(
                        {"_id": mongo_id},
                        {"$set": {
                            "status": "ingested",
                            "postgres_status": "ingested",
                            "uuid": row["uuid"],
                            "ingested_at": row["ingested_at"]
                        }}
                    )

                if insert_df is not None and not insert_df.empty:
                    print(f"[✓] Pushing client_name to XCom: {db_name}")
                    context["ti"].xcom_push(key="client_name", value=db_name)
                else:
                    print(f"[!] No rows inserted for {db_name}, skipping XCom push.")

        except Exception as e:
            print(f"[!] Failed to insert into Postgres DB '{target_pg_db}': {e}")

if __name__ == "__main__":
    load_mongo_to_postgres_raw()
