import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Dynamically add root project directory to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the script
from backend_scripts.ingest_csv_to_mongo_script import ingest_csv_to_mongo

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
    schedule_interval='@daily',
    catchup=False,
    tags=['supply_chain'],
)

# Define the task
task_import_csv = PythonOperator(
    task_id='ingest_csv_to_mongo',
    python_callable=ingest_csv_to_mongo,
    dag=dag,
)
