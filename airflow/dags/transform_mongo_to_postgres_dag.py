import sys
import os
from pathlib import Path
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

env = os.getenv("ENV", "LOCAL")

if env == "DOCKER":
    sys.path.append('/opt/airflow/backend_scripts/airflow_tasks')
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/backend_scripts/airflow_tasks")))

# Import transformation script
try:
    import transform_mongo_to_postgres
except ModuleNotFoundError as e:
    raise ImportError(f"Failed to import transform_mongo_to_postgres: {e}")

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 23),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='transform_mongo_to_postgres_dag',
    default_args=default_args,
    description='Transform MongoDB data and load to PostgreSQL',
    schedule_interval='@daily',
    catchup=False,
    tags=['supply_chain'],
) as dag:
    task = PythonOperator(
        task_id='transform_mongo_to_postgres',
        python_callable=transform_mongo_to_postgres.transform_mongo_to_postgres
    )
