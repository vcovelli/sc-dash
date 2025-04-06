import os
import shutil
import time
import pandas as pd
from pymongo import MongoClient
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["supply_chain_db"]
collection = db["supply_chain_raw"]

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
    """ Loads CSV into MongoDB and moves it to archive """
    try:
        print(f"Processing: {file_path}")

        # Load CSV
        df = pd.read_csv(file_path)

        if not df.empty:
            # Convert to dictionary format
            data = df.to_dict(orient="records")

            # Insert into MongoDB
            collection.insert_many(data)
            print(f"Inserted {len(data)} records into MongoDB.")

        # Move file to archive
        shutil.move(file_path, os.path.join(ARCHIVE_DIR, os.path.basename(file_path)))
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
