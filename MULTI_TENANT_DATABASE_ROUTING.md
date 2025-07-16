# Multi-Tenant Database Routing System

This document explains the newly implemented multi-tenant database routing system that allows each organization to have its own isolated PostgreSQL database.

## Overview

The system now supports true database isolation where each organization gets its own PostgreSQL database following the naming convention `orgdata_<org_id>`. Django automatically routes queries to the correct database based on the authenticated user's organization.

## Architecture

### 1. Database Router (`backend/config/routers.py`)
- **OrgDatabaseRouter**: Routes queries to organization-specific databases
- **Dynamic Configuration**: Automatically creates database configurations for organizations
- **Thread-Safe Context**: Uses thread-local storage to track current organization context

### 2. Middleware (`backend/config/middleware.py`)
- **OrgContextMiddleware**: Sets organization context for each request
- **Automatic Context Management**: Clears context after each request/exception

### 3. Enhanced Mixins (`backend/accounts/mixins.py`)
- **CombinedOrgMixin**: Updated to work with database routing
- **Organization Context Setting**: Ensures proper routing during queries

### 4. Management Commands
- **migrate_org_databases**: Creates and migrates organization-specific databases
- **setup_relational_test_data**: Enhanced to work with organization databases

## Database Naming Convention

- **Default Database**: Contains user accounts, organizations, auth data
- **Organization Databases**: `orgdata_<org_id>` (e.g., `orgdata_123`, `orgdata_456`)

## Models and Routing

### Organization-Specific Models (Routed to org databases):
- `api.Supplier`
- `api.Warehouse`
- `api.Product`
- `api.Inventory`
- `api.Customer`
- `api.Order`
- `api.OrderItem`
- `api.Shipment`

### Core Models (Stay in default database):
- `accounts.Organization`
- `accounts.CustomUser`
- `auth.*`
- `contenttypes.*`
- `sessions.*`

## Setup and Usage

### Initial Setup
```bash
# Run the setup script to configure everything
python scripts/setup_org_database_routing.py
```

### Manual Setup
```bash
# 1. Migrate default database
cd backend
python manage.py migrate

# 2. Create and migrate organization databases
python manage.py migrate_org_databases --create-databases

# 3. Set up test data for specific organization
python manage.py setup_relational_test_data --org-id=1
```

### Creating New Organizations
When a new organization is created, you need to set up its database:

```bash
# For organization with ID 123
python manage.py migrate_org_databases --org-id=123 --create-databases
```

## How It Works

### 1. User Authentication
- User logs in through Django auth
- Middleware sets organization context based on `user.org.id`

### 2. Query Routing
- Django ORM queries for organization models are intercepted
- Router checks organization context and routes to appropriate database
- Queries automatically use the correct `orgdata_<org_id>` database

### 3. Data Isolation
- Each organization's data is completely isolated in separate databases
- No cross-organization data access possible
- Maintains referential integrity within each organization's database

## Configuration

### Settings (`backend/config/settings.py`)
```python
# Database routing configuration
DATABASE_ROUTERS = ['config.routers.OrgDatabaseRouter']

# Middleware order (OrgContextMiddleware after authentication)
MIDDLEWARE = [
    # ... other middleware ...
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "config.middleware.OrgContextMiddleware",  # <- New middleware
    # ... other middleware ...
]
```

### Dynamic Database Configuration
Organization databases are configured automatically:
```python
# Example auto-generated configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'main_app_db',
        # ... other settings
    },
    'orgdata_123': {  # Auto-created for organization ID 123
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'orgdata_123',
        # ... other settings
    }
}
```

## Troubleshooting

### Common Issues

1. **"Object not found" errors**
   - Ensure user is assigned to an organization
   - Check if organization database exists and is migrated

2. **Database connection errors**
   - Verify PostgreSQL credentials in environment variables
   - Ensure organization database was created properly

3. **Migration errors**
   - Run migrations separately for each organization database
   - Use `--create-databases` flag when setting up new organizations

### Debugging Commands

```bash
# Check organization assignments
python manage.py shell
>>> from accounts.models import CustomUser
>>> user = CustomUser.objects.get(email='test@example.com')
>>> print(f"User org: {user.org}")

# List organization databases
python manage.py dbshell
# Then in PostgreSQL:
SELECT datname FROM pg_database WHERE datname LIKE 'orgdata_%';

# Test specific organization database
python manage.py migrate_org_databases --org-id=123
```

## Benefits

1. **True Data Isolation**: Each organization's data is completely separate
2. **Scalability**: Can distribute organization databases across multiple servers
3. **Security**: No risk of cross-organization data leaks
4. **Performance**: Smaller databases for each organization
5. **Compliance**: Easier to meet data residency requirements

## Migration from Single Database

If you had data in a single database previously, you'll need to:
1. Export organization-specific data
2. Create organization databases
3. Import data into respective organization databases
4. Update any custom scripts to use the new routing system

The existing test scripts and data pipelines should work with minimal changes since they already use the `orgdata_<org_id>` naming convention.