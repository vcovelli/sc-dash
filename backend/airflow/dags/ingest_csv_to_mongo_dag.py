import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Get the absolute path to backend_scripts
scripts_folder = "/home/vcovelli/projects/supply-chain-dashboard-2025/backend/backend_scripts"

# Add to sys.path if not already there
if scripts_folder not in sys.path:
    sys.path.insert(0, scripts_folder)

print(f"Scripts folder added to path: {scripts_folder}")  # Debugging

# Import the module
try:
    import ingest_csv_to_mongo_script
    print("Successfully imported ingest_csv_to_mongo_script")
except ModuleNotFoundError as e:
    print(f"Import failed: {e}")

# Default DAG arguments
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 22),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'ingest_csv_to_mongo_dag',
    default_args=default_args,
    description='Import CSV data to MongoDB and archive the file',
    schedule='@daily',
    catchup=False,
)

# Define the import task
task_import_csv = PythonOperator(
    task_id='ingest_csv_to_mongo',
    python_callable=ingest_csv_to_mongo_script.ingest_csv_to_mongo,
    dag=dag,
)

# Define task order (ONLY the import task)
task_import_csv
