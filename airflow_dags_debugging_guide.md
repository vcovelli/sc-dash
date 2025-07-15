# Airflow DAGs Debugging Guide: "Unknown" Table Issue

## Problem Summary

Your Airflow DAGs are experiencing issues where tables show up as "unknown" instead of their actual names, except for the "orders" table. This issue stems from several interconnected problems in the data pipeline configuration and table validation logic.

## Root Cause Analysis

### 1. **Hard-coded Table Types in Validation**

**Location**: `backend/backend_scripts/airflow_tasks/enhanced_ingest_from_minio.py:164-172`

```python
def get_required_fields_for_table(self, table_name: str) -> List[str]:
    """Get required fields based on table type - customize per organization needs"""
    table_requirements = {
        "orders": ["order_id", "customer_id", "order_date"],
        "products": ["product_id", "product_name"],
        "inventory": ["product_id", "location_id", "quantity"],
        "customers": ["customer_id", "customer_name"]
    }
    return table_requirements.get(table_name, [])  # Returns [] for unknown tables
```

**Problem**: Only 4 table types are predefined. Any table name not in this dictionary gets no validation rules.

### 2. **"Unknown" Default in File Upload**

**Location**: `backend/files/views.py:88`

```python
dag_config = {
    "org_id": str(request.user.org.id),
    "table": request.data.get("table", "unknown"),  # Defaults to "unknown"
    "file_id": str(uploaded_file.id),
    "user_id": str(request.user.id),
    "triggered_by": "file_upload"
}
```

**Problem**: If the frontend doesn't specify a table name, it defaults to "unknown".

### 3. **Generic Column Handling for Unknown Tables**

**Location**: `backend/backend_scripts/airflow_tasks/enhanced_load_mongo_to_postgres.py:134-139`

```python
else:
    # Generic columns for unknown table types
    base_columns.extend([
        ('data_id', 'TEXT'),
        ('description', 'TEXT'),
        ('value', 'TEXT'),
    ])
```

**Problem**: Unknown tables get generic column structures that may not match your actual data.

## Immediate Solutions

### Solution 1: Expand Table Type Support

Update the `get_required_fields_for_table` method to support more table types or make it more flexible:

```python
def get_required_fields_for_table(self, table_name: str) -> List[str]:
    """Get required fields based on table type - customize per organization needs"""
    table_requirements = {
        "orders": ["order_id", "customer_id", "order_date"],
        "products": ["product_id", "product_name"],
        "inventory": ["product_id", "location_id", "quantity"],
        "customers": ["customer_id", "customer_name"],
        # Add your specific table types here
        "sales": ["sale_id", "customer_id", "product_id", "sale_date"],
        "employees": ["employee_id", "name", "department"],
        "suppliers": ["supplier_id", "supplier_name"],
        # Add more as needed...
    }
    
    # For unknown tables, try to infer from the first few rows
    if table_name not in table_requirements:
        # Log the unknown table for debugging
        print(f"[WARNING] Unknown table type: {table_name}. Using minimal validation.")
        return []  # Or implement dynamic field detection
    
    return table_requirements.get(table_name, [])
```

### Solution 2: Fix Frontend Table Name Passing

Ensure your frontend properly specifies the table name when uploading files. The table name should be included in the request data:

```javascript
// Frontend example
const formData = new FormData();
formData.append('file', csvFile);
formData.append('table', 'your_table_name');  // Make sure this is set

fetch('/api/files/upload/', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### Solution 3: Implement Dynamic Table Detection

Add logic to detect table names from file names or content:

```python
def detect_table_name_from_file(self, file_name: str, file_content: pd.DataFrame) -> str:
    """Detect table name from file name or content"""
    
    # Method 1: Extract from filename
    base_name = Path(file_name).stem.lower()
    
    # Common patterns
    if 'order' in base_name:
        return 'orders'
    elif 'product' in base_name:
        return 'products'
    elif 'customer' in base_name:
        return 'customers'
    elif 'inventory' in base_name:
        return 'inventory'
    
    # Method 2: Analyze column headers
    columns = [col.lower() for col in file_content.columns]
    
    if 'order_id' in columns or 'order_date' in columns:
        return 'orders'
    elif 'product_id' in columns or 'product_name' in columns:
        return 'products'
    elif 'customer_id' in columns or 'customer_name' in columns:
        return 'customers'
    
    # Method 3: Ask user or use filename as table name
    return base_name.replace(' ', '_').replace('-', '_')
```

## Testing and Debugging Steps

### Step 1: Check Current DAG Status

```bash
# Navigate to your workspace
cd /workspace

# Check Airflow DAG status using the test script
python scripts/test_enhanced_pipeline.py --test-type all --org-id YOUR_ORG_ID
```

### Step 2: Test File Upload with Specific Table Names

```bash
# Use the management command to test specific scenarios
python backend/manage.py manage_enhanced_pipeline trigger-ingest \
    --org-id YOUR_ORG_ID \
    --table products \
    --file-id test_file_123
```

### Step 3: Debug MongoDB Collections

```python
# Connect to MongoDB and check what's being stored
from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DATABASE", "client_data")]

# List all collections
print("Collections in MongoDB:")
for collection_name in db.list_collection_names():
    if collection_name.startswith("raw_"):
        count = db[collection_name].count_documents({})
        print(f"  {collection_name}: {count} documents")

# Check a specific collection
collection = db["raw_unknown"]  # or whatever your problematic collection is
sample_doc = collection.find_one()
print(f"Sample document: {sample_doc}")
```

### Step 4: Check PostgreSQL Tables

```python
# Check what tables are created in PostgreSQL
from sqlalchemy import create_engine, text
import os

# Create engine for the org database
org_id = "YOUR_ORG_ID"
engine = create_engine(
    f"postgresql://{os.getenv('APP_DB_USER')}:{os.getenv('APP_DB_PASSWORD')}"
    f"@{os.getenv('PG_HOST')}:{os.getenv('PG_PORT')}/{os.getenv('PG_DB_PREFIX')}{org_id}"
)

with engine.connect() as conn:
    # List all tables
    result = conn.execute(text("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'raw_%'
    """))
    
    print("PostgreSQL tables:")
    for row in result:
        print(f"  {row[0]}")
```

## Quick Fixes for Immediate Testing

### Fix 1: Update the Enhanced Ingest Script

Add more table types or make the validation more flexible:

```python
# Add this to enhanced_ingest_from_minio.py
def get_required_fields_for_table(self, table_name: str) -> List[str]:
    """Get required fields based on table type"""
    
    # Basic validation for any table
    if table_name == "unknown":
        # For unknown tables, require at least one ID field
        return ["id"]  # or any basic requirement
    
    table_requirements = {
        "orders": ["order_id", "customer_id", "order_date"],
        "products": ["product_id", "product_name"],
        "inventory": ["product_id", "location_id", "quantity"],
        "customers": ["customer_id", "customer_name"],
        # Add your specific tables here
    }
    
    # Return empty list for validation (permissive) or basic requirements
    return table_requirements.get(table_name, [])
```

### Fix 2: Improve Table Name Detection in File Upload

Update the file upload view to better detect table names:

```python
# In backend/files/views.py, around line 88
def determine_table_name(self, file_name: str, request_table: str = None) -> str:
    """Determine table name from request or file name"""
    
    if request_table and request_table != "unknown":
        return request_table
    
    # Extract from filename
    base_name = Path(file_name).stem.lower()
    
    # Map common patterns
    table_mappings = {
        'order': 'orders',
        'product': 'products',
        'customer': 'customers',
        'inventory': 'inventory',
        'sale': 'sales',
        'employee': 'employees'
    }
    
    for pattern, table_name in table_mappings.items():
        if pattern in base_name:
            return table_name
    
    # Use filename as table name (cleaned)
    return base_name.replace(' ', '_').replace('-', '_')

# Then update the DAG config:
table_name = self.determine_table_name(file_name, request.data.get("table"))
dag_config = {
    "org_id": str(request.user.org.id),
    "table": table_name,  # Use determined table name
    "file_id": str(uploaded_file.id),
    "user_id": str(request.user.id),
    "triggered_by": "file_upload"
}
```

## Monitoring and Debugging Commands

### Check DAG Status
```bash
# Check overall pipeline status
python backend/manage.py manage_enhanced_pipeline status --org-id YOUR_ORG_ID

# Check specific DAG run
python backend/manage.py manage_enhanced_pipeline status --org-id YOUR_ORG_ID --verbose
```

### Trigger Manual Tests
```bash
# Test ingestion manually
python backend/manage.py manage_enhanced_pipeline trigger-ingest \
    --org-id YOUR_ORG_ID \
    --table your_table_name \
    --file-id your_file_id

# Test PostgreSQL load
python backend/manage.py manage_enhanced_pipeline trigger-postgres-load \
    --org-id YOUR_ORG_ID \
    --table your_table_name
```

### Check Data Quality
```bash
# Generate quality report
python backend/manage.py manage_enhanced_pipeline quality \
    --org-id YOUR_ORG_ID \
    --table your_table_name \
    --days 7
```

## Environment Verification

Make sure these environment variables are properly set:

```bash
# Check critical environment variables
echo "AIRFLOW_API_BASE: $AIRFLOW_API_BASE"
echo "MONGO_URI: $MONGO_URI"
echo "PG_HOST: $PG_HOST"
echo "PG_DB_PREFIX: $PG_DB_PREFIX"
```

## Expected Workflow

1. **File Upload** → Frontend specifies table name or system detects it
2. **Enhanced Ingest DAG** → Validates table type and processes data to MongoDB
3. **MongoDB to PostgreSQL DAG** → Transfers data with proper table structure
4. **Forecast DAG** → Runs analysis on clean data

## Common Issues and Solutions

### Issue 1: "Unknown" tables keep appearing
- **Solution**: Update table mappings in `get_required_fields_for_table()`
- **Quick fix**: Modify frontend to always specify table names

### Issue 2: MongoDB collections not transferring to PostgreSQL
- **Solution**: Check collection naming patterns and PostgreSQL connection
- **Debug**: Use the test script to check MongoDB to PostgreSQL flow

### Issue 3: DAGs not triggering properly
- **Solution**: Verify Airflow API credentials and connectivity
- **Debug**: Check Airflow web UI for DAG status and logs

## Next Steps

1. **Immediate**: Update the table type mapping to include your specific table types
2. **Short-term**: Implement automatic table name detection from file content
3. **Long-term**: Create a UI for users to specify table types and validation rules

Would you like me to implement any of these fixes or help you test specific scenarios?