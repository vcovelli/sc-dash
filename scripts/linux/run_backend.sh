#!/bin/bash
echo "Starting Django Backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
