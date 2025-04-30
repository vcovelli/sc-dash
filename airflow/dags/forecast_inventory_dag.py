import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

env = os.getenv("ENV", "LOCAL")

if env == "DOCKER":
    sys.path.append('/opt/airflow/backend_scripts')
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/backend_scripts")))

# Import forecasting script
from forecast_inventory import forecast_inventory

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 24),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='forecast_inventory_dag',
    default_args=default_args,
    description='Forecast inventory demand from transformed PostgreSQL data',
    schedule_interval='@daily',
    catchup=False,
    tags=['supply_chain', 'forecasting'],
) as dag:
    forecast_task = PythonOperator(
        task_id='forecast_inventory',
        python_callable=forecast_inventory,
    )
