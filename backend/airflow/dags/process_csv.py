from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
from pathlib import Path

project_root = Path(__file__).resolve().parents[2]
script_path = project_root / "backend" / "scripts" / "load_csv_to_postgres.py"

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 19),
    'catchup': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='process_csv_dag',
    default_args=default_args,
    description='Run CSV processing script',
    schedule_interval='@hourly',
    tags=['supply_chain'],
) as dag:
    task = BashOperator(
        task_id='run_csv_processing',
        bash_command=f'python3 {script_path}'
    )
