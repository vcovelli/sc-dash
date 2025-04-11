#!/bin/bash
echo "Starting Airflow Setup"

# Load environment variables
set -a
source /app/.env
set +a

# Fix log folder permissions
chown -R airflow: /opt/airflow/logs

# Wait for PostgreSQL
until nc -z "$AIRFLOW_DB_HOST" "$AIRFLOW_DB_PORT"; do
  echo "Waiting for PostgreSQL at $AIRFLOW_DB_HOST:$AIRFLOW_DB_PORT..."
  sleep 2
done

# Init DB
airflow db migrate

# Create admin user (only if it doesn't exist)
airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@example.com \
  --password admin || true

# Start Airflow
exec airflow webserver
