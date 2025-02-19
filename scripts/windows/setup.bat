@echo off
echo Setting up Windows environment...

REM Install Python dependencies
pip install -r backend\requirements.txt

REM Setup Airflow
cd airflow
airflow db init
airflow users create --username admin --password admin --firstname Air --lastname Flow --role Admin --email admin@example.com
