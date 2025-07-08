import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Determine environment path
env = os.getenv("ENV", "LOCAL")
if env == "DOCKER":
    sys.path.append('/opt/airflow/backend_scripts/forecasting')
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/backend_scripts/forecasting")))

from forecast_inventory import forecast_inventory

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 24),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def forecast_with_env(**context):
    client_id = context["dag_run"].conf.get("client_id")
    if not client_id:
        raise ValueError("Missing 'client_id' in dag_run.conf")

    os.environ["CLIENT_NAME"] = client_id
    forecast_inventory()

with DAG(
    dag_id='forecast_inventory_dag',
    default_args=default_args,
    description='Forecast inventory demand per client',
    schedule_interval=None,  # manual/API only
    catchup=False,
    tags=['forecasting'],
) as dag:
    forecast_task = PythonOperator(
        task_id='forecast_inventory',
        python_callable=forecast_with_env,
        provide_context=True,
    )
