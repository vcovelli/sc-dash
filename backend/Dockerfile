FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

# Install system build tools and libraries, including PostgreSQL client
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    netcat-openbsd \
    libpq-dev \
    libffi-dev \
    curl \
    git \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend-requirements.txt ./requirements.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy the project files
COPY . .

# Expose the Django default port
EXPOSE 8000

# Set up the entrypoint script
COPY backend_entrypoint.sh /app/backend_entrypoint.sh
RUN chmod +x /app/backend_entrypoint.sh

ENTRYPOINT ["/app/backend_entrypoint.sh"]
