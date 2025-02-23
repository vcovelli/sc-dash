import sys
import os
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from pymongo import MongoClient
from sqlalchemy import create_engine

# Add backend_scripts to sys.path
scripts_folder = "/home/vcovelli/projects/supply-chain-dashboard-2025/backend/backend_scripts"
if scripts_folder not in sys.path:
    sys.path.insert(0, scripts_folder)

# Import transformation script
try:
    import transform_mongo_to_postgres
    print("Successfully imported transform_mongo_to_postgres")
except ModuleNotFoundError as e:
    print(f"Import failed: {e}")

# Default DAG arguments
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 23),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define DAG
dag = DAG(
    'transform_mongo_to_postgres_dag',
    default_args=default_args,
    description='Extract from MongoDB, transform, and load into PostgreSQL',
    schedule='@daily',
    catchup=False,
)

# Define task
task_transform_mongo_to_postgres = PythonOperator(
    task_id='transform_mongo_to_postgres',
    python_callable=transform_mongo_to_postgres.transform_mongo_to_postgres,
    dag=dag,
)
