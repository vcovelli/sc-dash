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
        endpoint_url=os.getenv("MINIO_ENDPOINT"),
        aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
        config=Config(signature_version="s3v4"),
        region_name=os.getenv("MINIO_REGION", "us-east-1")
    )
    bucket_name = os.getenv("MINIO_BUCKET_NAME")

    file_id = context["dag_run"].conf.get("file_id")
    if not file_id:
        raise ValueError("No file_id provided in dag_run.conf")

    try:
        paginator = s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=bucket_name)

        found_csv = False

        for page in pages:
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if not key.endswith(".csv"):
                    continue
                
                if "archive/" in key:
                    continue  # skip already archived files

                found_csv = True
                print(f"Processing {key}...")

                # Determine client name from filename
                filename = key.split("/")[-1]
                parts = filename.replace(".csv", "").split("_")
                if len(parts) < 2:
                    raise ValueError(f"Filename format invalid: {filename}")
                uuid_prefix, client_name = parts[0], parts[1]  # Extract client_name (UUID prefix) from filename

                db = client[client_name]
                collection = db["raw_data"]

                # Read from S3
                response = s3.get_object(Bucket=bucket_name, Key=key)
                df = pd.read_csv(BytesIO(response['Body'].read()))

                if not df.empty:
                    # Add composite key
                    if "order_id" in df.columns and "product_name" in df.columns:
                        df["composite_key"] = df["order_id"].astype(str) + "_" + df["product_name"].astype(str)
                    else:
                        raise ValueError("Missing 'order_id' or 'product_name' column needed for composite_key.")

                    for record in df.to_dict(orient="records"):
                        existing = collection.find_one({"composite_key": record["composite_key"]})

                        if existing:
                            # Check for changes in fields (excluding _id and status)
                            changes = {
                                k: v for k, v in record.items()
                                if k != "_id" and existing.get(k) != v
                            }
                            if changes:
                                changes["status"] = "updated"
                                changes["last_modified"] = pd.Timestamp.utcnow()
                                collection.update_one(
                                    {"composite_key": record["composite_key"]},
                                    {"$set": changes}
                                )
                                print(f"Updated record with composite_key {record['composite_key']}")
                        else:
                            record["status"] = "ingested"
                            record["ingested_at"] = pd.Timestamp.utcnow()
                            collection.insert_one(record)
                    print(f"Inserted {len(df)} records into '{client_name}.raw_data'")

                    # Archive & delete the file after processing
                    archive_key = f"archive/{key}"
                    s3.copy_object(
                        Bucket=bucket_name,
                        CopySource={'Bucket': bucket_name, 'Key': key},
                        Key=archive_key
                    )
                    s3.delete_object(Bucket=bucket_name, Key=key)

                    # Notify backend
                    try:
                        response = requests.post(
                            f"{BACKEND_API_URL}/api/uploads/mark-success/",
                            json={"file_id": file_id},
                            timeout=5
                        )
                        if response.status_code == 200:
                            print(f"Marked '{filename}' as ingested successfully.")
                        else:
                            print(f"Failed to mark success for '{filename}': {response.text}")
                    except Exception as notify_err:
                        print(f"Error notifying backend for '{filename}': {notify_err}")
    except Exception as e:
        print(f"Error: {e}")
