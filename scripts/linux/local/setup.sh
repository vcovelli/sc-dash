#!/bin/bash
echo "Initial Setup Script"

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
  source .env
  set +a
else
  echo ".env file not found!"
  exit 1
fi

# Export Airflow DAGs folder from .env
if [ -n "$AIRFLOW__CORE__DAGS_FOLDER" ]; then
  export AIRFLOW__CORE__DAGS_FOLDER
  echo "DAGs folder set to: $AIRFLOW__CORE__DAGS_FOLDER"
else
  echo "AIRFLOW__CORE__DAGS_FOLDER not set in .env!"
  exit 1
fi

# Install dependencies
if [ -f "requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
fi

# Setup Airflow DB + User (only if not exist)
echo "Ensuring Airflow PostgreSQL user & DB exist..."
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'airflow') THEN CREATE USER airflow WITH PASSWORD 'airflow'; END IF; END \$\$;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'airflow'" | grep -q 1 || sudo -u postgres createdb -O airflow airflow

# Wipe and re-init Airflow DB
echo "Resetting Airflow DB (dev only)..."
airflow db reset -y
airflow db init

# Create Airflow Admin
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@example.com \
  --password admin

# Run Django migrations
cd backend || exit
echo "Running Django migrations..."
python manage.py migrate

echo "Setup complete. Use ./scripts/linux/local/start.sh to start everything."
