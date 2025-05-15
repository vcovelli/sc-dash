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

# Apply database migrations
python manage.py makemigrations api
python manage.py makemigrations accounts
python manage.py migrate


# Create Django superuser if it doesn't exist
echo "from django.contrib.auth import get_user_model; \
User = get_user_model(); \
User.objects.filter(username='admin').exists() or \
User.objects.create_superuser('admin', 'admin@example.com', 'admin')" \
| python manage.py shell

# Start server
exec python manage.py runserver 0.0.0.0:8000
