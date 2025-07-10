# MinIO Configuration Fix

## Problem Summary

Your MinIO setup had multiple configuration issues causing authentication mismatches and endpoint conflicts:

1. **Mixed Endpoints**: Code was inconsistently using both local (`localhost:9000`) and remote (`minio.supplywise.ai`) endpoints
2. **Hardcoded Configuration**: Some files had hardcoded remote endpoints regardless of environment
3. **Docker Redirect Issue**: Local MinIO was configured to redirect to remote console
4. **Missing Environment Variables**: Several MinIO settings weren't properly configured in docker-compose

## What Was Fixed

### 1. Docker Compose Configuration (`docker-compose.yaml`)

**Before:**
- MinIO had `MINIO_BROWSER_REDIRECT_URL: https://minio.supplywise.ai/console/`
- Backend services lacked MinIO environment variables

**After:**
- Removed remote redirect for local development
- Added comprehensive MinIO environment variables to all services:
  ```yaml
  environment:
    MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio:9000}
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    MINIO_BUCKET_NAME: ${MINIO_BUCKET_NAME:-uploads}
    MINIO_SECURE: ${MINIO_SECURE:-false}
    MINIO_HTTP_ENDPOINT: ${MINIO_HTTP_ENDPOINT:-http://minio:9000}
  ```

### 2. Centralized MinIO Client (`backend/helpers/minio_client.py`)

Created a new utility module that provides:
- `get_minio_client()` - Standardized MinIO client
- `get_boto3_client()` - Standardized boto3 S3 client for MinIO
- `get_bucket_name()` - Centralized bucket name configuration
- `ensure_bucket_exists()` - Automatic bucket creation
- `get_minio_config_info()` - Configuration debugging

### 3. Backend Code Updates

**Schema Generation (`backend/datagrid/views/schema.py`):**
- Removed hardcoded `"minio.supplywise.ai"` endpoint
- Now uses centralized configuration via environment variables

**File Operations (`backend/files/views.py`):**
- Standardized all MinIO operations to use centralized client
- Removed duplicate configuration code

**Scripts (`scripts/schema_wizard.py`):**
- Updated to use backend's centralized MinIO configuration

### 4. Environment Configuration (`.env.example`)

Created comprehensive environment template with:
- Local development settings (Docker containers)
- Production settings (commented out)
- Clear documentation for each setting

## How to Use

### For Local Development:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Use the local development settings** (already configured in .env.example):
   ```env
   MINIO_ENDPOINT=minio:9000
   MINIO_HTTP_ENDPOINT=http://minio:9000
   MINIO_SECURE=false
   MINIO_BUCKET_NAME=uploads
   ```

3. **Start your services:**
   ```bash
   docker-compose up -d
   ```

4. **Access MinIO console at:** http://localhost:9001

### For Production:

1. **Update your .env file** with production settings:
   ```env
   MINIO_ENDPOINT=minio.supplywise.ai
   MINIO_HTTP_ENDPOINT=https://minio.supplywise.ai
   MINIO_SECURE=true
   MINIO_BUCKET_NAME=production-uploads
   ```

## Key Benefits

1. **No More Signature Mismatches**: All services use the same credentials and endpoints
2. **Environment-Based Configuration**: Easy switching between local and production
3. **Centralized Management**: All MinIO operations go through one configuration point
4. **Automatic Bucket Creation**: Buckets are created automatically if they don't exist
5. **Consistent Error Handling**: Standardized error handling across all MinIO operations

## Testing Your Setup

After implementing these changes:

1. **Check MinIO connectivity:**
   ```bash
   # From inside backend container
   python manage.py shell
   >>> from helpers.minio_client import get_minio_config_info
   >>> print(get_minio_config_info())
   ```

2. **Test file upload/download** through your application

3. **Verify MinIO console access** at http://localhost:9001

## Troubleshooting

If you still have issues:

1. **Check environment variables are loaded:**
   ```bash
   docker-compose exec backend env | grep MINIO
   ```

2. **Verify MinIO is running:**
   ```bash
   docker-compose ps minio
   ```

3. **Check logs:**
   ```bash
   docker-compose logs minio
   docker-compose logs backend
   ```

The key fix was **standardizing the configuration** so all parts of your application use the same MinIO endpoint and credentials, eliminating the authentication mismatches you were experiencing.