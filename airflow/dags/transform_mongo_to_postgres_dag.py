import sys
from pathlib import Path
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Dynamically resolve the scripts folder
dag_dir = Path(__file__).resolve().parent
project_root = dag_dir.parents[1]  # dag_dir = airflow/dags → project root is one level up
scripts_folder = project_root / "backend" / "backend_scripts"

# Add to sys.path
sys.path.insert(0, str(scripts_folder))

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
