#!/bin/bash
echo "Starting Django Setup"

# Wait for PostgreSQL
until nc -z "$PG_HOST" "$PG_PORT"; do
  echo "Waiting for PostgreSQL at $PG_HOST:$PG_PORT..."
  sleep 2
done

python manage.py migrate
exec python manage.py runserver 0.0.0.0:8000
