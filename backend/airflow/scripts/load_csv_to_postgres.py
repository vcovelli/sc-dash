import os
import pandas as pd
from sqlalchemy import create_engine

# Database connection details
DB_NAME = "supply_chain_db"
DB_USER = "your_username"
DB_PASSWORD = "your_password"
DB_HOST = "localhost"  # Change if your DB is remote
DB_PORT = "5432"  # Default PostgreSQL port

# Folder where CSV files are placed
DATA_FOLDER = "datasets/"  # Change to your preferred directory

# Create database connection
engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

def process_csv_files():
    """
    Automatically detects CSV files in the 'datasets' folder, loads them into PostgreSQL,
    and moves processed files to an 'archive' folder.
    """
    if not os.path.exists(DATA_FOLDER):
        print(f"Error: Data folder '{DATA_FOLDER}' not found.")
        return
    
    files = [f for f in os.listdir(DATA_FOLDER) if f.endswith(".csv")]
    
    if not files:
        print("No new CSV files found in datasets folder.")
        return

    for file in files:
        file_path = os.path.join(DATA_FOLDER, file)
        print(f"Processing file: {file_path}")

        try:
            df = pd.read_csv(file_path)
            df.to_sql("supply_chain_raw", engine, if_exists="append", index=False)
            print(f"✅ Successfully loaded {file} into supply_chain_raw.")
            
            # Move processed file to an archive folder
            archive_folder = os.path.join(DATA_FOLDER, "archive/")
            os.makedirs(archive_folder, exist_ok=True)
            os.rename(file_path, os.path.join(archive_folder, file))
            print(f"📁 Moved {file} to archive folder.")

        except Exception as e:
            print(f"❌ Error processing {file}: {e}")

# Run the function
process_csv_files()
