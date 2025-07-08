import os
import requests
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
import boto3
from botocore.client import Config
from io import BytesIO

def ingest_from_minio_once(**context):
    """Reads all CSVs from MinIO, inserts them into Mongo, then deletes the CSV."""

    # Load environment variables
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

    # MongoDB connection
    MONGO_URI = os.getenv("MONGO_URI")
    BACKEND_API_URL = os.getenv("BACKEND_API_URL")
    client = MongoClient(MONGO_URI)

    # MinIO / S3 config
    s3 = boto3.client(
        "s3",
        endpoint_url=os.getenv("MINIO_HTTP_ENDPOINT"),
        aws_access_key_id=os.getenv("MINIO_ROOT_USER"),
        aws_secret_access_key=os.getenv("MINIO_ROOT_PASSWORD"),
        config=Config(signature_version="s3v4"),
        region_name=os.getenv("MINIO_REGION", "us-east-1")
    )
    bucket_name = os.getenv("MINIO_BUCKET_NAME")

    conf = context["dag_run"].conf
    file_id = conf.get("file_id")
    org_id = conf.get("org_id")
    client_id = conf.get("client_id")    # Optional
    table = conf.get("table")            # Should be provided or inferred elsewhere

    if not file_id:
        raise ValueError("No file_id provided in dag_run.conf")
    if not org_id:
        raise ValueError("No org_id provided in dag_run.conf")
    if not table:
        raise ValueError("No table name provided in dag_run.conf")  # Strongly recommend requiring this

    try:
        paginator = s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=bucket_name)

        for page in pages:
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if not key.endswith(".csv"):
                    continue
                if "archive/" in key:
                    continue  # skip already archived files

                print(f"Processing {key}...")

                # Use unified DB with separate collections
                mongo_db_name = os.getenv("MONGO_DATABASE", "client_data")
                db = client[mongo_db_name]
                collection = db[f"raw_{table}"]

                # Read from S3
                response = s3.get_object(Bucket=bucket_name, Key=key)
                df = pd.read_csv(BytesIO(response['Body'].read()))

                # Normalize all column names
                original_cols = df.columns.tolist()
                df.columns = [c.strip().lower() for c in df.columns]
                print(f"Columns in '{key}': {original_cols} -> {df.columns.tolist()}")

                if not df.empty:
                    row_count = len(df)

                    # Inject org_id, client_id, and table to every record (overwriting any conflicting columns)
                    df["org_id"] = org_id
                    df["table"] = table
                    if client_id is not None:
                        df["client_id"] = client_id

                    # Dynamically find all columns ending with '_id', but EXCLUDE client_id from dedup
                    id_cols = [col for col in df.columns if col.endswith('_id') and col != "client_id"]
                    if not id_cols:
                        print(f"Warning: No _id columns (besides client_id) in '{key}'. Using all columns as deduplication key.")
                        id_cols = [c for c in df.columns if c not in ["client_id", "org_id", "table", "composite_key", "postgres_status", "status", "ingested_at"]]
                    if not id_cols:
                        raise ValueError(f"No columns found to act as deduplication key in '{key}'.")

                    # Build composite key for deduplication at the ORG level (not client)
                    dedup_cols = ["org_id"] + id_cols
                    dedup_cols = list(dict.fromkeys(dedup_cols))  # Remove accidental duplicates
                    df["composite_key"] = df[dedup_cols].astype(str).agg("_".join, axis=1)
                    print(f"Using columns {dedup_cols} as composite key for '{key}'.")

                    # Ensure MongoDB has an index for fast lookup (idempotent)
                    collection.create_index("composite_key", unique=True)

                    # Ingest with deduplication
                    insert_count = 0
                    update_count = 0
                    for record in df.to_dict(orient="records"):
                        # Always set postgres_status
                        record["postgres_status"] = "pending"
                        record["ingested_at"] = pd.Timestamp.utcnow()
                        record["status"] = "ingested"  # optional, for backward compat

                        existing = collection.find_one({"composite_key": record["composite_key"]})
                        if existing:
                            # Only update changed fields (except _id)
                            changes = {
                                k: v for k, v in record.items()
                                if k != "_id" and existing.get(k) != v
                            }
                            if changes:
                                changes["postgres_status"] = "pending"  # force re-ingest if updated
                                changes["last_modified"] = pd.Timestamp.utcnow()
                                collection.update_one(
                                    {"composite_key": record["composite_key"]},
                                    {"$set": changes}
                                )
                                update_count += 1
                                print(f"Updated record with composite_key {record['composite_key']}")
                        else:
                            collection.insert_one(record)
                            insert_count += 1

                    print(f"Inserted {insert_count} new records, updated {update_count} existing in 'raw_{table}'")

                    # Archive and delete original file
                    archive_key = f"archive/{key}"
                    s3.copy_object(Bucket=bucket_name, CopySource={'Bucket': bucket_name, 'Key': key}, Key=archive_key)
                    s3.delete_object(Bucket=bucket_name, Key=key)

                    # Notify backend with row_count
                    try:
                        token = os.getenv("AIRFLOW_MARK_SUCCESS_TOKEN")
                        headers = {}
                        if token:
                            headers = {"Authorization": f"Bearer {token}"}

                        response = requests.post(
                            f"{BACKEND_API_URL}/api/files/mark-success/",
                            json={
                                "file_id": file_id,
                                "row_count": row_count,
                            },
                            headers=headers,
                            timeout=5
                        )
                        if response.status_code == 200:
                            print(f"Marked '{key}' as ingested successfully.")
                        else:
                            print(f"Failed to mark success for '{key}': {response.text}")
                    except Exception as notify_err:
                        print(f"Error notifying backend for '{key}': {notify_err}")

    except Exception as e:
        print(f"Error: {e}")
