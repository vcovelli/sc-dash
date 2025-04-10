#!/bin/bash
echo "Starting Django Setup"

# Load environment variables
set -a
source /app/.env  # Adjust this path based on where .env is in the container
set +a

# Wait for PostgreSQL
until nc -z "$PG_HOST" "$PG_PORT"; do
  echo "Waiting for PostgreSQL at $PG_HOST:$PG_PORT..."
  sleep 2
done

python manage.py migrate
exec python manage.py runserver 0.0.0.0:8000
