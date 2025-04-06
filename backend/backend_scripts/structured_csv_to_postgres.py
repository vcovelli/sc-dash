import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy.orm import sessionmaker

# Load .env from the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)


# Database connection details from .env
PG_DATABASE = os.getenv("PG_DATABASE")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = int(os.getenv("PG_PORT", 5432))

# Folder where CSV files are placed
DATA_FOLDER = os.getenv("DATA_FOLDER")

# Create database connection
engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}")

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
            Session = sessionmaker(bind=engine)
            session = Session()

            df.to_sql(
                name="supply_chain_processed",
                con=engine,
                schema="public",
                if_exists="append",
                index=False,
                method="multi"
            )

            session.commit()
            session.close()

            print(f"Successfully loaded {file} into supply_chain_processed.")

            # Move only after success
            archive_folder = os.path.join(DATA_FOLDER, "archive/")
            os.makedirs(archive_folder, exist_ok=True)
            os.rename(file_path, os.path.join(archive_folder, file))
            print(f"📁 Moved {file} to archive folder.")

        except Exception as e:
            print(f"Error processing {file}: {e}")

# Run the function
process_csv_files()