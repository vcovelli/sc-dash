#!/bin/bash
echo "Starting Airflow Setup"

airflow db init

airflow users create \
  --username admin \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email admin@example.com \
  --password admin || true  # Skip if already exists

exec airflow webserver
