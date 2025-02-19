#!/bin/bash
echo "Setting up the Linux environment..."

# Install Python dependencies
pip install -r backend/requirements.txt

# Setup Airflow
cd airflow
airflow db init
airflow users create --username admin --password admin --firstname Air --lastname Flow --role Admin --email admin@example.com
