import os
import shutil
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

# Directories
DATASETS_DIR = os.getenv("DATASET_DIR", "/opt/airflow/datasets")
ARCHIVE_DIR = os.getenv("ARCHIVE_DIR", "/opt/airflow/datasets/archive")
os.makedirs(ARCHIVE_DIR, exist_ok=True)

def ingest_from_folder_once():
    """Scans datasets folder, loads each CSV to its corresponding MongoDB client DB, then archives it."""
    for filename in os.listdir(DATASETS_DIR):
        if filename.endswith(".csv"):
            file_path = os.path.join(DATASETS_DIR, filename)
            try:
                print(f"Processing {filename}...")

                # Determine client name (e.g., acme_corp from acme_corp_orders.csv)
                client_name = filename.split("_")[0]
                db = client[client_name]
                collection = db["raw_data"]

                # Read and insert data
                df = pd.read_csv(file_path)
                if not df.empty:
                    collection.insert_many(df.to_dict(orient="records"))
                    print(f"Inserted {len(df)} records into '{client_name}.raw_data'")

                # Archive file
                shutil.move(file_path, os.path.join(ARCHIVE_DIR, filename))
                print(f"Moved {filename} to archive.")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
