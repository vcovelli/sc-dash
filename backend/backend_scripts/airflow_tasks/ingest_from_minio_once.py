import os
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
import boto3
from botocore.client import Config
from io import BytesIO

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

# MinIO / S3 config
s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("MINIO_ENDPOINT"),
    aws_access_key_id=os.getenv("MINIO_ROOT_USER"),
    aws_secret_access_key=os.getenv("MINIO_ROOT_PASSWORD"),
    config=Config(signature_version="s3v4"),
    region_name=os.getenv("MINIO_REGION", "us-east-1")
)
bucket_name = os.getenv("MINIO_BUCKET_NAME")

def ingest_from_minio_once():
    """Reads all CSVs from MinIO, inserts them into Mongo, then deletes the CSV."""
    try:
        # List CSV files in bucket
        objects = s3.list_objects_v2(Bucket=bucket_name)
        if "Contents" not in objects:
            print("No files found in bucket.")
            return

        for obj in objects["Contents"]:
            key = obj["Key"]
            if not key.endswith(".csv"):
                continue

            print(f"Processing {key}...")

            # Determine client name from filename
            client_name = key.split("_")[0]
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
                    collection.update_one(
                        {"composite_key": record["composite_key"]},
                        {"$set": record},
                        upsert=True
                    )
                print(f"Inserted {len(df)} records into '{client_name}.raw_data'")

                # Optionally delete the file after processing
                s3.delete_object(Bucket=bucket_name, Key=key)
                print(f"Deleted {key} from bucket.")
    except Exception as e:
        print(f"Error: {e}")
