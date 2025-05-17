import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

env = os.getenv("ENV", "LOCAL")

if env == "DOCKER":
    sys.path.append('/opt/airflow/backend_scripts/airflow_tasks')
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/backend_scripts/airflow_tasks")))

# Import the script
from ingest_from_minio_once import ingest_from_minio_once

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
    description='Scan MinIO and ingest CSVs to MongoDB by client',
    schedule_interval=None,
    catchup=False,
    tags=['supply_chain'],
)

# Define the task
task_import_csv = PythonOperator(
    task_id='ingest_csv_from_minio_to_mongo',
    python_callable=ingest_from_minio_once,
    provide_context=True,
    dag=dag,
)

# Define the trigger task
trigger_mongo_to_postgres = TriggerDagRunOperator(
    task_id="trigger_mongo_to_postgres_dag",
    trigger_dag_id="load_mongo_to_postgres_dag",
    wait_for_completion=False,
    dag=dag,
)

# Set task dependencies
task_import_csv >> trigger_mongo_to_postgres