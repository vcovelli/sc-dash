import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy.orm import sessionmaker

# Load .env from the project root
env_path = Path("/home/vcovelli/projects/supply-chain-dashboard-2025/.env")
load_dotenv(dotenv_path=env_path, override=True)


# Database connection details from .env
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 5432))

# Folder where CSV files are placed
DATA_FOLDER = os.getenv("DATA_FOLDER")

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
            # Create a database session
            Session = sessionmaker(bind=engine)
            session = Session()

            # Use the engine directly in to_sql()
            df.to_sql(
                name="supply_chain_raw",
                con=engine,  # ✅ Directly use engine, NOT connection!
                schema="public",
                if_exists="append",
                index=False,
                method="multi"
            )

            # Commit and close session
            session.commit()
            session.close()

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