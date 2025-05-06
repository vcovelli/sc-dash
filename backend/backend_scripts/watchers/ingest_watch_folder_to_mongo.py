import os
import shutil
import time
import pandas as pd
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
MONGO_DATABASE = os.getenv("MONGO_DATABASE")
MONGO_COLLECTION_RAW = os.getenv("MONGO_COLLECTION_RAW")
db = client[MONGO_DATABASE]
collection = db[MONGO_COLLECTION_RAW]

# Directories
DATASETS_DIR = os.path.abspath("../datasets")
ARCHIVE_DIR = os.path.abspath("../archive")

# Ensure archive folder exists
os.makedirs(ARCHIVE_DIR, exist_ok=True)

class CSVHandler(FileSystemEventHandler):
    """ Watches for new CSV files and processes them """
    def on_created(self, event):
        if event.src_path.endswith(".csv"):
            process_csv(event.src_path)

def process_csv(file_path):
    """ Dynamically loads CSV into a client-specific MongoDB database and moves it to archive """
    try:
        print(f"Processing: {file_path}")

        # Extract filename and infer client name (e.g., acme_corp from acme_corp_orders.csv)
        filename = os.path.basename(file_path)
        client_name = filename.split("_")[0]  # Customize if your naming format is different

        # Load CSV
        df = pd.read_csv(file_path)

        if not df.empty:
            # Convert to dictionary format
            data = df.to_dict(orient="records")

            # Connect to client-specific DB and shared 'raw_data' collection
            client_db = client[client_name]
            collection = client_db["raw_data"]

            # Insert into MongoDB
            collection.insert_many(data)
            print(f"Inserted {len(data)} records into MongoDB database '{client_name}'.")

        # Move file to archive
        shutil.move(file_path, os.path.join(ARCHIVE_DIR, filename))
        print(f"Moved {file_path} to archive.")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def monitor_folder():
    """ Monitors the datasets folder for new files """
    observer = Observer()
    event_handler = CSVHandler()
    observer.schedule(event_handler, DATASETS_DIR, recursive=False)
    
    print(f"Watching {DATASETS_DIR} for new CSV files...")
    observer.start()

    try:
        while True:
            time.sleep(5)  # Keeps the script running
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()

if __name__ == "__main__":
    monitor_folder()
