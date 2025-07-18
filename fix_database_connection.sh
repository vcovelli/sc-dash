#!/bin/bash

echo "============================================================"
echo "🔧 SUPPLYWISE AI - DATABASE CONNECTION FIX SCRIPT"
echo "============================================================"

echo "🔄 Attempting to fix database connection issue..."

# Method 1: Get actual PostgreSQL IP and update configuration
echo ""
echo "📍 Method 1: Using direct IP connection"
echo "Getting PostgreSQL container IP..."

POSTGRES_IP=$(docker inspect workspace_postgres_1 2>/dev/null | grep '"IPAddress"' | tail -1 | cut -d'"' -f4)

if [ -n "$POSTGRES_IP" ]; then
    echo "PostgreSQL IP found: $POSTGRES_IP"
    echo "Backing up current .env file..."
    cp .env .env.backup
    
    echo "Updating PG_HOST to use IP address..."
    sed -i "s/PG_HOST=postgres/PG_HOST=$POSTGRES_IP/" .env
    
    echo "Restarting backend service..."
    docker-compose restart backend
    
    echo "Waiting for backend to restart..."
    sleep 15
    
    echo "Testing database connection..."
    if docker-compose exec -T backend python manage.py migrate --dry-run &>/dev/null; then
        echo "✅ Connection successful! Running migrations..."
        docker-compose exec -T backend python manage.py migrate
        
        if [ $? -eq 0 ]; then
            echo "✅ Migrations completed successfully!"
            echo "🏢 Creating organization..."
            docker-compose exec -T backend python manage.py create_organization "My Test Company"
            echo "📊 Creating sample data..."
            docker-compose exec -T backend python manage.py create_sample_data --org "My Test Company"
            echo ""
            echo "🎉 SUCCESS! SupplyWise AI is now fully configured!"
            echo "🌐 Access the application at: http://192.168.1.42:3000"
            exit 0
        fi
    else
        echo "❌ Method 1 failed. Restoring .env file..."
        mv .env.backup .env
    fi
else
    echo "❌ Could not get PostgreSQL IP"
fi

# Method 2: Complete restart with dependency ordering
echo ""
echo "📍 Method 2: Dependency-ordered restart"
echo "Stopping all services..."
docker-compose down

echo "Starting PostgreSQL first..."
docker-compose up -d postgres
sleep 20

echo "Starting MongoDB..."
docker-compose up -d mongo
sleep 10

echo "Starting MinIO..."
docker-compose up -d minio
sleep 10

echo "Starting backend..."
docker-compose up -d backend
sleep 20

echo "Starting remaining services..."
docker-compose up -d

echo "Waiting for services to stabilize..."
sleep 30

echo "Testing database connection..."
if docker-compose exec -T backend python manage.py migrate --dry-run &>/dev/null; then
    echo "✅ Connection successful! Running migrations..."
    docker-compose exec -T backend python manage.py migrate
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully!"
        echo "🏢 Creating organization..."
        docker-compose exec -T backend python manage.py create_organization "My Test Company"
        echo "📊 Creating sample data..."
        docker-compose exec -T backend python manage.py create_sample_data --org "My Test Company"
        echo ""
        echo "🎉 SUCCESS! SupplyWise AI is now fully configured!"
        echo "🌐 Access the application at: http://192.168.1.42:3000"
        exit 0
    fi
else
    echo "❌ Method 2 failed."
fi

# Method 3: Docker network reset (if user confirms)
echo ""
echo "📍 Method 3: Docker network reset (DESTRUCTIVE)"
read -p "This will remove all Docker networks and containers. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping all containers..."
    docker-compose down
    
    echo "Pruning Docker networks..."
    docker network prune -f
    
    echo "Starting services..."
    docker-compose up -d
    
    echo "Waiting for services to start..."
    sleep 60
    
    echo "Testing database connection..."
    if docker-compose exec -T backend python manage.py migrate --dry-run &>/dev/null; then
        echo "✅ Connection successful! Running migrations..."
        docker-compose exec -T backend python manage.py migrate
        
        if [ $? -eq 0 ]; then
            echo "✅ Migrations completed successfully!"
            echo "🏢 Creating organization..."
            docker-compose exec -T backend python manage.py create_organization "My Test Company"
            echo "📊 Creating sample data..."
            docker-compose exec -T backend python manage.py create_sample_data --org "My Test Company"
            echo ""
            echo "🎉 SUCCESS! SupplyWise AI is now fully configured!"
            echo "🌐 Access the application at: http://192.168.1.42:3000"
            exit 0
        fi
    else
        echo "❌ Method 3 failed."
    fi
fi

echo ""
echo "❌ All methods failed. Manual intervention required."
echo "📋 Please check the setup_status_report.md for detailed analysis."
echo "🔧 Consider contacting system administrator for Docker network configuration."
exit 1