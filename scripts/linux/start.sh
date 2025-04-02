#!/bin/bash
echo "Starting Services"

cd "$(dirname "$0")/../.." || { echo "Project root not found!"; exit 1; }

# Activate virtualenv
if [ -d "backend_env" ]; then
  source backend_env/bin/activate
fi

# Load environment variables
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo ".env file not found!"
  exit 1
fi

# Set Airflow vars
export AIRFLOW_HOME=~/airflow
export AIRFLOW__CORE__DAGS_FOLDER=$(pwd)/backend/airflow/dags
export AIRFLOW__CORE__EXECUTOR=LocalExecutor
export AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://$AIRFLOW_DB_USER:$AIRFLOW_DB_PASSWORD@$AIRFLOW_DB_HOST:$AIRFLOW_DB_PORT/$AIRFLOW_DB_NAME

# Ensure PostgreSQL is running
echo "Checking if PostgreSQL is running..."
if ! pg_isready -h "$AIRFLOW_DB_HOST" -p "$AIRFLOW_DB_PORT" > /dev/null; then
  echo "PostgreSQL is not running. Attempting to start it..."
  sudo systemctl start postgresql
fi

# Start Airflow and Django
echo "Starting Airflow webserver and scheduler..."
airflow webserver --port 8080 &> /dev/null &
airflow scheduler &> /dev/null &

echo "Starting Django server..."
cd backend || exit
python manage.py runserver 0.0.0.0:8000
