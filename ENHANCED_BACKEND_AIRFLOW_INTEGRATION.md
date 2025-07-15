# Enhanced Backend Airflow Integration

This document describes the comprehensive updates made to integrate the new enhanced Airflow DAGs with the backend system.

## Overview

The backend has been updated to use the new enhanced Airflow scripts and DAGs for improved data pipeline management with organization-aware processing, better error handling, and comprehensive monitoring.

## New Features Added

### 1. Enhanced API Endpoints (`backend/api/views/airflow_operations.py`)

#### **EnhancedIngestDAGView**
- **Endpoint**: `POST /api/airflow/trigger/enhanced-ingest/`
- **Purpose**: Trigger the enhanced organization-aware ingest DAG
- **Payload**:
```json
{
    "org_id": "123",
    "table": "products", 
    "file_id": "file_456",
    "user_id": "user_789"
}
```

#### **EnhancedMongoToPostgresDAGView**
- **Endpoint**: `POST /api/airflow/trigger/mongo-to-postgres/`
- **Purpose**: Trigger enhanced MongoDB to PostgreSQL transfer
- **Payload**:
```json
{
    "org_id": "123",
    "table": "products",
    "triggered_by": "ingest_completion"
}
```

#### **ForecastInventoryDAGView**
- **Endpoint**: `POST /api/airflow/trigger/forecast-inventory/`
- **Purpose**: Trigger inventory forecasting
- **Payload**:
```json
{
    "client_id": "org_123"
}
```

#### **DAGStatusView**
- **Endpoints**: 
  - `GET /api/airflow/status/<dag_id>/`
  - `GET /api/airflow/status/<dag_id>/<dag_run_id>/`
- **Purpose**: Get status of DAG runs

#### **PipelineStatusView**
- **Endpoint**: `GET /api/airflow/pipeline-status/`
- **Purpose**: Get comprehensive pipeline status for user's organization

### 2. Updated File Upload Process (`backend/files/views.py`)

The file upload process now uses the enhanced organization-aware ingest DAG instead of the old one:

**Changes Made**:
- Switched from `ingest_csv_to_mongo_dag` to `enhanced_org_aware_ingest_dag`
- Added organization-aware configuration
- Enhanced metadata tracking
- Improved error handling

**New Configuration**:
```python
dag_config = {
    "org_id": str(request.user.org.id),
    "table": request.data.get("table", "unknown"),
    "file_id": str(uploaded_file.id),
    "user_id": str(request.user.id),
    "triggered_by": "file_upload"
}
```

### 3. Enhanced Data Pipeline Manager (`backend/backend_scripts/data_pipeline_manager.py`)

Added new methods for Airflow integration:

#### **New Methods**:
- `trigger_enhanced_ingest_dag()` - Trigger enhanced ingest with organization awareness
- `trigger_postgres_load_dag()` - Trigger MongoDB to PostgreSQL load
- `trigger_forecast_dag()` - Trigger inventory forecasting
- `get_organization_status()` - Get org-specific status
- `get_overall_status()` - Get overall pipeline status
- `generate_quality_report()` - Generate data quality reports
- `get_audit_trail()` - Get audit trail data

### 4. Management Command (`backend/api/management/commands/manage_enhanced_pipeline.py`)

A comprehensive Django management command for pipeline operations:

#### **Available Commands**:
```bash
# Show pipeline status
python manage.py manage_enhanced_pipeline status --org-id 123

# Trigger enhanced ingest
python manage.py manage_enhanced_pipeline trigger-ingest --org-id 123 --table products --file-id file_456

# Trigger PostgreSQL load
python manage.py manage_enhanced_pipeline trigger-postgres-load --org-id 123 --table products

# Trigger forecasting
python manage.py manage_enhanced_pipeline trigger-forecast --client-id org_123

# Generate quality report
python manage.py manage_enhanced_pipeline quality --org-id 123 --table products --days 7

# Show audit trail
python manage.py manage_enhanced_pipeline audit --org-id 123
```

## Updated DAGs Integration

### 1. Enhanced Organization-Aware Ingest DAG
- **File**: `airflow/dags/enhanced_org_aware_ingest_dag.py`
- **Purpose**: Process file uploads with organization context
- **Features**:
  - Organization-specific processing
  - Enhanced validation
  - Comprehensive logging
  - Automatic downstream triggering

### 2. Enhanced MongoDB to PostgreSQL DAG
- **File**: `airflow/dags/enhanced_mongo_to_postgres_dag.py`
- **Purpose**: Transfer data from MongoDB to PostgreSQL with improvements
- **Features**:
  - Organization-aware transfers
  - Data validation
  - Performance optimization
  - Error recovery

### 3. Forecast Inventory DAG
- **File**: `airflow/dags/forecast_inventory_dag.py`
- **Purpose**: Perform inventory forecasting for clients
- **Features**:
  - Client-specific forecasting
  - Integration with forecasting scripts
  - Automated scheduling support

## Environment Variables

Ensure these environment variables are set:

```bash
# Airflow API Configuration
AIRFLOW_API_BASE=http://airflow:8080/api/v1
AIRFLOW_USERNAME=airflow
AIRFLOW_PASSWORD=airflow

# Database Configuration
MONGO_URI=mongodb://mongo:27017
MONGO_DATABASE=client_data
PG_HOST=postgres
PG_PORT=5432
PG_DB_PREFIX=orgdata_
APP_DB_USER=your_db_user
APP_DB_PASSWORD=your_db_password
```

## API Usage Examples

### 1. Trigger Enhanced Ingest

```python
import requests

response = requests.post('http://backend:8000/api/airflow/trigger/enhanced-ingest/', 
    json={
        "org_id": "123",
        "table": "products",
        "file_id": "file_456",
        "user_id": "user_789"
    },
    headers={'Authorization': 'Bearer your_token'}
)
```

### 2. Check Pipeline Status

```python
response = requests.get('http://backend:8000/api/airflow/pipeline-status/',
    headers={'Authorization': 'Bearer your_token'}
)
```

### 3. Trigger PostgreSQL Load

```python
response = requests.post('http://backend:8000/api/airflow/trigger/mongo-to-postgres/',
    json={
        "org_id": "123",
        "table": "products"
    },
    headers={'Authorization': 'Bearer your_token'}
)
```

## Benefits of the Enhanced Integration

### 1. **Organization Awareness**
- All operations are now organization-specific
- Better data isolation and security
- Improved multi-tenancy support

### 2. **Enhanced Monitoring**
- Comprehensive status tracking
- Real-time pipeline monitoring
- Detailed audit trails

### 3. **Improved Error Handling**
- Better error recovery mechanisms
- Enhanced logging and debugging
- Graceful failure handling

### 4. **Performance Optimization**
- Optimized data transfer processes
- Better resource utilization
- Reduced processing overhead

### 5. **Easier Management**
- Django management commands for operations
- API endpoints for programmatic access
- Comprehensive configuration options

## Migration Notes

### From Old System to Enhanced System

1. **DAG Names Updated**:
   - `ingest_csv_to_mongo_dag` → `enhanced_org_aware_ingest_dag`
   - Added new DAGs for enhanced functionality

2. **Configuration Format**:
   - Enhanced with organization context
   - Additional metadata fields
   - Better validation

3. **API Endpoints**:
   - New endpoints for enhanced operations
   - Backward compatibility maintained where possible

4. **Environment Setup**:
   - Ensure all environment variables are configured
   - Update any existing scripts to use new endpoints

## Troubleshooting

### Common Issues

1. **DAG Not Found**
   - Ensure DAGs are deployed to Airflow
   - Check Airflow web UI for DAG availability

2. **Authentication Errors**
   - Verify AIRFLOW_USERNAME and AIRFLOW_PASSWORD
   - Check Airflow API permissions

3. **Organization Not Found**
   - Ensure user is associated with an organization
   - Check organization ID validity

4. **Database Connection Issues**
   - Verify database environment variables
   - Check network connectivity

### Debugging

1. **Enable Verbose Logging**:
```bash
python manage.py manage_enhanced_pipeline status --org-id 123 --verbose
```

2. **Check Airflow Logs**:
   - Access Airflow web UI
   - Review DAG run logs
   - Check task-specific logs

3. **Monitor Database Connections**:
   - Check MongoDB and PostgreSQL connectivity
   - Verify organization-specific databases

## Future Enhancements

1. **Real-time Notifications**
   - WebSocket integration for live updates
   - Email/SMS notifications for critical events

2. **Advanced Analytics**
   - Enhanced quality metrics
   - Performance analytics dashboard
   - Predictive maintenance

3. **Automated Scaling**
   - Dynamic resource allocation
   - Auto-scaling based on workload
   - Cost optimization features

## Conclusion

The enhanced backend Airflow integration provides a robust, scalable, and organization-aware data pipeline system. The new features improve monitoring, error handling, and overall system reliability while maintaining ease of use and comprehensive functionality.