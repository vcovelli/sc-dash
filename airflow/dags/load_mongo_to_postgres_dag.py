import os
import sys
from airflow import DAG
from airflow.operators.python import PythonOperator, ShortCircuitOperator
from airflow.api.common.experimental.trigger_dag import trigger_dag
from datetime import datetime, timedelta

# Add path to backend_scripts so Python can find function
sys.path.append('/opt/airflow/backend_scripts/airflow_tasks')
from load_mongo_to_postgres_raw import load_mongo_to_postgres_raw

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 24),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def check_should_trigger_forecast(**context):
    client_name = context["ti"].xcom_pull(task_ids="load_mongo_to_postgres_raw", key="client_name")
    print(f"[DEBUG] ShortCircuit: client_name = {client_name}")
    return client_name is not None

def trigger_forecast_dag(**context):
    client_name = context["ti"].xcom_pull(task_ids="load_mongo_to_postgres_raw", key="client_name")
    print(f"[DEBUG] XCom pulled client_name: {client_name}")
    if not client_name:
        raise ValueError("Client name not found in XCom.")

    trigger_dag(
        dag_id="forecast_inventory_dag",
        conf={"client_name": client_name},
        execution_date=None,
        replace_microseconds=False,
    )
    print(f"[✓] Triggered forecast_inventory_dag for client: {client_name}")

with DAG(
    dag_id='load_mongo_to_postgres_dag',
    default_args=default_args,
    description='Load MongoDB data into PostgreSQL raw table',
    schedule_interval=None,
    catchup=False,
    tags=['supply_chain'],
) as dag:

    ingest_task = PythonOperator(
        task_id='load_mongo_to_postgres_raw',
        python_callable=load_mongo_to_postgres_raw,
        provide_context=True
    )

    check_task = ShortCircuitOperator(
        task_id='check_should_trigger_forecast',
        python_callable=check_should_trigger_forecast,
        provide_context=True
    )

    trigger_task = PythonOperator(
        task_id="trigger_forecast_dag",
        python_callable=trigger_forecast_dag,
        provide_context=True
    )

    ingest_task >> check_task >> trigger_task
