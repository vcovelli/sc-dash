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

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

MONGO_URI = os.getenv("MONGO_URI")
PG_USER = os.getenv("APP_DB_USER")
PG_PASSWORD = os.getenv("APP_DB_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_DB_PREFIX = os.getenv("PG_DB_PREFIX", "orgdata_")
RAW_TABLE = "raw_orders"
LOG_TABLE = "raw_orders_log"

def load_user_schema_columns(org_id):
    SCHEMA_DIR = Path(os.environ.get("SCHEMA_DIR", BASE_DIR / "user_schemas"))
    schema_path = Path(SCHEMA_DIR) / f"{org_id.lower()}_schema.csv"
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

def create_org_database(org_id):
    db_name = f"{PG_DB_PREFIX}{org_id}"
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
        mongo_db_name = os.getenv("MONGO_DATABASE", "client_data")
        db = client[mongo_db_name]
    except Exception as e:
        print(f"[!] Error connecting to MongoDB: {e}")
        return

    for collection_name in db.list_collection_names():
        if not collection_name.startswith("raw_"):
            continue

        collection = db[collection_name]
        raw_data = list(collection.find({"postgres_status": {"$ne": "ingested"}}))

        if not raw_data:
            print(f"[=] No new data in {collection_name}")
            continue

        df = pd.DataFrame(raw_data)
        df.columns = df.columns.str.lower()

        # Must have org_id in every record
        if "org_id" not in df.columns:
            print(f"[!] Missing org_id in collection {collection_name}, skipping.")
            continue
        org_id = str(df["org_id"].iloc[0])

        # Find deduplication keys (all '_id' columns except 'client_id')
        id_cols = [col for col in df.columns if col.endswith('_id') and col != "client_id"]
        dedup_cols = ["org_id"] + id_cols
        dedup_cols = list(dict.fromkeys(dedup_cols))  # Remove accidental duplicates
        if not id_cols:
            print(f"[!] No id_cols found for deduplication in {collection_name}, skipping.")
            continue

        # Recompute composite_key in DataFrame
        df["composite_key"] = df[dedup_cols].astype(str).agg("_".join, axis=1)

        required_keys = ['order_id', 'product_id', 'order_date', 'ingested_at', 'version', 'composite_key']
        for col in required_keys:
            if col not in df.columns:
                if col == 'version':
                    df[col] = 1
                elif col == 'ingested_at':
                    df[col] = datetime.now(timezone.utc)
                else:
                    df[col] = None

        target_pg_db = create_org_database(org_id)
        if not target_pg_db:
            continue

        try:
            engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{target_pg_db}")
            schema_columns = load_user_schema_columns(org_id)
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
                mongo_ids = df["_id"].tolist() if "_id" in df.columns else []
                for idx, mongo_id in enumerate(mongo_ids):
                    collection.update_one(
                        {"_id": mongo_id},
                        {"$set": {
                            "status": "ingested",
                            "postgres_status": "ingested",
                            "uuid": str(uuid.uuid4()),
                            "ingested_at": datetime.now(timezone.utc)
                        }}
                    )

                if insert_df is not None and not insert_df.empty:
                    print(f"[✓] Pushing org_id to XCom: {org_id}")
                    context["ti"].xcom_push(key="org_id", value=org_id)
                else:
                    print(f"[!] No rows inserted for {org_id}, skipping XCom push.")

        except Exception as e:
            print(f"[!] Failed to insert into Postgres DB '{target_pg_db}': {e}")

if __name__ == "__main__":
    load_mongo_to_postgres_raw()
