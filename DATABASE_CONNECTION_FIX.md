# Database Connection Fix for orgdata_10 Connection Error

## Problem Description

The Django application is throwing a `ConnectionDoesNotExist` error when trying to access the `/api/suppliers/` endpoint:

```
ConnectionDoesNotExist at /api/suppliers/
The connection 'orgdata_10' doesn't exist.
```

## Root Cause Analysis

The error occurs because:

1. **User Authentication**: The user is authenticated and belongs to organization ID 10
2. **Database Routing**: The `OrgDatabaseRouter` tries to route queries to database `orgdata_10`
3. **Missing Configuration**: The Django application doesn't have the proper database configuration for `orgdata_10`
4. **Environment Variables**: The production environment is missing or has incorrect database connection parameters

## Evidence

From the pgAdmin screenshot, we can confirm:
- Database `orgdata_10` exists and contains data
- Tables like `api_supplier` are present with supplier records
- The database is accessible via pgAdmin from the same network

## Solutions

### Solution 1: Fix Environment Variables (Recommended)

The production deployment needs correct environment variables. Based on the codebase analysis, update the production environment with:

```bash
# Production Environment Variables (.env or deployment config)
APP_DB_NAME=supplywise_db
APP_DB_USER=app_user
APP_DB_PASSWORD=your_actual_password
PG_HOST=your_actual_database_host
PG_PORT=5432

# Django Configuration
DJANGO_SECRET_KEY=your_production_secret_key
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=supplywise.ai,localhost,127.0.0.1
```

### Solution 2: Database Router Configuration

Ensure the database router can create connections properly. The router in `config/routers.py` dynamically creates database configurations:

```python
def _ensure_org_database_config(self, org_id):
    """Ensure the organization database is configured in Django"""
    if not org_id:
        return None
        
    db_alias = self._get_org_db_alias(org_id)  # Returns 'orgdata_10'
    
    # Check if database configuration already exists
    if db_alias in settings.DATABASES:
        return db_alias
        
    # Create database configuration dynamically
    org_db_config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': f'orgdata_{org_id}',  # 'orgdata_10'
        'USER': os.getenv('APP_DB_USER'),
        'PASSWORD': os.getenv('APP_DB_PASSWORD'),
        'HOST': os.getenv('PG_HOST', 'postgres'),
        'PORT': os.getenv('PG_PORT', '5432'),
    }
    
    # Add to Django's database configuration
    settings.DATABASES[db_alias] = org_db_config
    return db_alias
```

### Solution 3: Manual Database Configuration

Add explicit database configurations in `settings.py` for known organization databases:

```python
# In backend/config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('APP_DB_NAME'),
        'USER': os.getenv('APP_DB_USER'),
        'PASSWORD': os.getenv('APP_DB_PASSWORD'),
        'HOST': os.getenv('PG_HOST', 'postgres'),
        'PORT': os.getenv('PG_PORT', '5432'),
    },
    # Add known organization databases
    'orgdata_10': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'orgdata_10',
        'USER': os.getenv('APP_DB_USER'),
        'PASSWORD': os.getenv('APP_DB_PASSWORD'),
        'HOST': os.getenv('PG_HOST', 'postgres'),
        'PORT': os.getenv('PG_PORT', '5432'),
    }
}
```

### Solution 4: Database Connection Testing

Use the provided test script to verify database connectivity:

```bash
python3 test_db_connection.py
```

This will test connections to both the main database and orgdata_10.

## Implementation Steps

### For Docker Deployment:

1. **Update docker-compose.yaml** or deployment configuration with correct environment variables
2. **Restart the backend service** to reload environment variables
3. **Verify database connectivity** using the test script

### For Direct Deployment:

1. **Create/update .env file** in the backend directory
2. **Set correct database credentials**:
   - Host: The actual PostgreSQL server hostname/IP
   - User: Database user with access to orgdata_10
   - Password: Correct password for the database user
3. **Restart the Django application**

### Production Environment Variables:

Based on the pgAdmin connection, the production configuration should be:

```bash
# Replace with actual values from your production environment
APP_DB_USER=app_user
APP_DB_PASSWORD=your_production_password
PG_HOST=your_database_server_ip_or_hostname
PG_PORT=5432
```

## Verification

After implementing the fix:

1. **Check Django admin**: Navigate to Django admin to ensure basic connectivity
2. **Test API endpoint**: Access `/api/suppliers/` endpoint
3. **Monitor logs**: Check Django logs for any remaining connection errors
4. **Verify multi-tenancy**: Test with different organization users

## Monitoring

Add logging to track database connection issues:

```python
# In config/routers.py
import logging
logger = logging.getLogger(__name__)

def _ensure_org_database_config(self, org_id):
    logger.info(f"Creating database configuration for org {org_id}")
    # ... existing code
```

## Common Issues

1. **Wrong Host**: Make sure PG_HOST points to the correct database server
2. **Network Access**: Ensure the Django application can reach the database server
3. **Credentials**: Verify the database user has access to orgdata_10 database
4. **Firewall**: Check that port 5432 is accessible from the application server
5. **SSL**: If using SSL connections, ensure proper SSL configuration

## Security Notes

- Never commit actual passwords to version control
- Use environment variables for all sensitive configuration
- Ensure database users have minimal required permissions
- Consider using connection pooling for production deployments