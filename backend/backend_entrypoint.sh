#!/bin/bash
echo "Starting Django Setup"

# Load environment variables
set -a
source /app/.env
set +a

# Wait for PostgreSQL
until nc -z "$PG_HOST" "$PG_PORT"; do
  echo "Waiting for PostgreSQL at $PG_HOST:$PG_PORT..."
  sleep 2
done

# Supply the password for psql!
export PGPASSWORD="$APP_DB_PASSWORD"

# Ensure DB exists
psql -h "$PG_HOST" -U "$APP_DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$APP_DB_NAME'" | grep -q 1 || \
psql -h "$PG_HOST" -U "$APP_DB_USER" -d postgres -c "CREATE DATABASE $APP_DB_NAME"

# Apply migrations
python manage.py makemigrations api
python manage.py makemigrations accounts
python manage.py makemigrations ai
python manage.py makemigrations analytics
python manage.py makemigrations datagrid
python manage.py makemigrations files

python manage.py migrate

# Create superuser if needed
echo "from django.contrib.auth import get_user_model; \
User = get_user_model(); \
User.objects.filter(username='admin').exists() or \
User.objects.create_superuser('admin', 'admin@example.com', 'admin')" \
| python manage.py shell

# Start Django
exec python manage.py runserver 0.0.0.0:8000
