from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 19),
    'catchup': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'process_csv_dag',
    default_args=default_args,
    description='A DAG that runs the CSV processing script',
    schedule_interval='@hourly',  # Adjust schedule as needed
    tags=['supply_chain'],
)

process_csv_task = BashOperator(
    task_id='run_csv_processing',
    bash_command='python3 ~/projects/supply-chain-dashboard-2025/backend/scripts/load_csv_to_postgres.py',
    dag=dag,
)

process_csv_task
