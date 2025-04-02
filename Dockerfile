FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy requirements file from context (must be relative to docker-compose.yml)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy backend source code into container
COPY . .

# Expose Django default port
EXPOSE 8000

# Default command
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
