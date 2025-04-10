#!/bin/bash
echo "Starting Services"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../../.." || { echo "Project root not found!"; exit 1; }

# Activate virtualenv
if [ -d "sc_env" ]; then
  echo "Activating virtual environment..."
  source sc_env/bin/activate
else
  echo "Virtual environment not found!"
  exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
  echo "Loading environment variables..."
  set -a
  source <(grep -v '^#' .env | sed 's/\s*#.*//g')
  set +a
else
  echo ".env file not found!"
  exit 1
fi

# Set Airflow vars (fallback to .env if already defined)
export AIRFLOW_HOME="${AIRFLOW_HOME:-$HOME/airflow}"
export AIRFLOW__CORE__DAGS_FOLDER="${AIRFLOW__CORE__DAGS_FOLDER:-$(pwd)/airflow/dags}"
export AIRFLOW__CORE__EXECUTOR="${AIRFLOW__CORE__EXECUTOR:-LocalExecutor}"
export AIRFLOW__DATABASE__SQL_ALCHEMY_CONN="postgresql+psycopg2://$AIRFLOW_DB_USER:$AIRFLOW_DB_PASSWORD@$AIRFLOW_DB_HOST:$AIRFLOW_DB_PORT/$AIRFLOW_DB_NAME"

# Ensure logs directory exists
mkdir -p logs

# Ensure PostgreSQL is running
echo "Checking if PostgreSQL is running..."
if ! pg_isready -h "$AIRFLOW_DB_HOST" -p "$AIRFLOW_DB_PORT" > /dev/null; then
  echo "PostgreSQL is not running. Attempting to start it..."
  sudo systemctl start postgresql
fi

# Start Airflow and Django
echo "Starting Airflow webserver..."
airflow webserver --port 8080 >> logs/airflow_webserver.log 2>&1 &

sleep 3

echo "Starting Airflow scheduler..."
airflow scheduler >> logs/airflow_scheduler.log 2>&1 &

echo "Starting Django server..."
cd backend || exit 1
python manage.py runserver 0.0.0.0:8000
