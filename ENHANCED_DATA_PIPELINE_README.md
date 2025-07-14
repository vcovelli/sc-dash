# Enhanced Organization-Aware Data Pipeline 🚀

## Overview

This document describes the enhanced data pipeline system that provides comprehensive organization-aware data processing with audit trails, version control, data quality monitoring, and multi-tenant isolation.

## 🎯 Key Features

### ✅ **Phase 1 Enhancements (Implemented)**

#### 1. **Enhanced Composite Key Strategy**
- **Organization-aware keys**: `org_{org_id}_{table_name}_{business_keys}`
- **Collision prevention**: SHA256 hashing for overly long keys
- **Business key flexibility**: Automatic detection or manual specification
- **Data isolation**: Complete separation between organizations

#### 2. **Comprehensive Version Control & Audit Trails**
- **Full versioning**: Every data change creates a new version
- **Change detection**: SHA256 hashing to detect actual data changes
- **Audit metadata**: Who, what, when, why for every change
- **Data lineage**: Track data flow from source to destination
- **Change logs**: Detailed logs of all modifications

#### 3. **Organization-Aware DAGs**
- **Multi-tenant processing**: Parallel processing for different organizations
- **Enhanced error handling**: Comprehensive error recovery and notifications
- **Permission checks**: Validate organization permissions before processing
- **Resource isolation**: Separate processing paths for different organizations

#### 4. **Data Quality Framework**
- **Automated validation**: Real-time data quality checks during ingestion
- **Quality scoring**: Comprehensive metrics (completeness, consistency, validity)
- **Issue tracking**: Automatic detection and reporting of data quality issues
- **Trend analysis**: Historical quality metrics and trends

#### 5. **Enhanced Database Schema**
- **MongoDB collections**: `raw_{org_id}_{table_name}` for complete isolation
- **PostgreSQL tables**: Enhanced schema with audit columns
- **Indexes**: Optimized indexes for performance
- **Metadata storage**: Comprehensive metadata for all operations

---

## 📁 File Structure

### **Enhanced Airflow Tasks**
```
backend/backend_scripts/airflow_tasks/
├── enhanced_ingest_from_minio.py          # Enhanced MinIO ingestion
├── enhanced_load_mongo_to_postgres.py     # Enhanced MongoDB → PostgreSQL
├── ingest_from_minio_once.py              # Legacy (for comparison)
└── load_mongo_to_postgres_raw.py          # Legacy (for comparison)
```

### **Enhanced DAGs**
```
airflow/dags/
├── enhanced_org_aware_ingest_dag.py       # Enhanced ingestion DAG
├── enhanced_mongo_to_postgres_dag.py      # Enhanced loading DAG
├── ingest_csv_to_mongo_dag.py             # Legacy (for comparison)
└── load_mongo_to_postgres_dag.py          # Legacy (for comparison)
```

### **Enhanced Models**
```
backend/datagrid/
├── enhanced_models.py                     # New audit trail models
├── models.py                              # Existing models
└── migrations/                            # Database migrations
```

### **Management Tools**
```
backend/backend_scripts/
└── data_pipeline_manager.py               # Comprehensive management CLI
```

---

## 🏗️ Architecture

### **Data Flow**

```
MinIO (CSV Files)
       ↓
Enhanced Ingestion (Organization-aware)
       ↓
MongoDB (raw_{org_id}_{table_name})
       ↓
Enhanced Loading (Version-aware)
       ↓
PostgreSQL (orgdata_{org_id}.raw_{table_name})
       ↓
Analytics & Forecasting
```

### **Enhanced Data Record Structure**

#### **MongoDB Record Format**
```json
{
  "_id": ObjectId(),
  "org_id": "org_123",
  "composite_key": "org_123_orders_ORD001_CUST456_2024-01-15",
  "table": "orders",
  
  // Business data
  "order_id": "ORD001",
  "customer_id": "CUST456",
  "product_id": "PROD789",
  "order_date": "2024-01-15",
  "amount": 99.99,
  
  // Enhanced metadata
  "version": 1,
  "data_hash": "sha256_hash_of_business_data",
  "change_type": "INSERT",
  "changed_fields": [],
  "changed_by_user_id": "user_456",
  "previous_version": null,
  "audit_trail": {
    "change_type": "INSERT",
    "changed_fields": [],
    "previous_version": null,
    "change_timestamp": "2024-01-15T10:30:00Z",
    "source_file": {
      "filename": "orders_2024_01_15.csv",
      "file_size": 2048,
      "file_id": "file_789"
    },
    "validation_status": "PASSED",
    "validation_errors": [],
    "data_quality_score": 0.95,
    "processing_metadata": {
      "ingestion_pipeline_version": "2.0",
      "data_lineage": "MinIO -> MongoDB -> PostgreSQL"
    }
  },
  "data_quality": {
    "status": "PASSED",
    "errors": [],
    "warnings": [],
    "quality_score": 0.95
  },
  "ingested_at": "2024-01-15T10:30:00Z",
  "last_modified": "2024-01-15T10:30:00Z",
  "postgres_status": "pending",
  "is_active": true
}
```

#### **PostgreSQL Table Schema**
```sql
CREATE TABLE raw_orders (
    -- Business columns
    org_id TEXT NOT NULL,
    composite_key TEXT NOT NULL,
    order_id TEXT,
    customer_id TEXT,
    product_id TEXT,
    order_date DATE,
    amount DECIMAL(10,2),
    
    -- Enhanced audit columns
    version INTEGER NOT NULL DEFAULT 1,
    data_hash TEXT,
    change_type VARCHAR(10) DEFAULT 'INSERT',
    changed_fields JSONB,
    changed_by_user_id TEXT,
    previous_version INTEGER,
    audit_trail JSONB,
    ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    postgres_status VARCHAR(20) DEFAULT 'pending',
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    data_quality JSONB,
    source_file_metadata JSONB,
    processing_metadata JSONB,
    
    -- Enhanced primary key with versioning
    PRIMARY KEY (org_id, composite_key, version)
);

-- Optimized indexes
CREATE INDEX idx_raw_orders_org_active ON raw_orders (org_id, is_active);
CREATE INDEX idx_raw_orders_composite_latest ON raw_orders (composite_key, version DESC);
CREATE INDEX idx_raw_orders_ingested_at ON raw_orders (ingested_at);
CREATE INDEX idx_raw_orders_changed_by ON raw_orders (changed_by_user_id);
CREATE INDEX idx_raw_orders_data_quality ON raw_orders USING gin (data_quality);
```

### **Audit Trail Tables**

#### **Change Log Table**
```sql
CREATE TABLE raw_orders_change_log (
    id SERIAL PRIMARY KEY,
    org_id TEXT NOT NULL,
    composite_key TEXT NOT NULL,
    old_version INTEGER,
    new_version INTEGER NOT NULL,
    change_type VARCHAR(10) NOT NULL,
    changed_fields JSONB,
    changed_by_user_id TEXT,
    change_timestamp TIMESTAMPTZ DEFAULT NOW(),
    old_data_hash TEXT,
    new_data_hash TEXT,
    change_metadata JSONB,
    source_info JSONB
);
```

#### **Data Quality Metrics Table**
```sql
CREATE TABLE raw_orders_quality_metrics (
    id SERIAL PRIMARY KEY,
    org_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    measurement_timestamp TIMESTAMPTZ DEFAULT NOW(),
    total_records INTEGER,
    records_with_errors INTEGER,
    records_with_warnings INTEGER,
    average_quality_score DECIMAL(5,4),
    quality_metrics JSONB,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);
```

---

## 🚀 Getting Started

### **1. Migration from Legacy System**

#### **Database Migrations**
```bash
# Create new enhanced models
cd backend
python manage.py makemigrations datagrid
python manage.py migrate

# The enhanced system works alongside the legacy system
# No immediate migration required - both systems can coexist
```

#### **DAG Transition**
```bash
# New enhanced DAGs are available immediately:
# - enhanced_org_aware_ingest_dag
# - enhanced_mongo_to_postgres_dag

# Legacy DAGs continue to work:
# - ingest_csv_to_mongo_dag  
# - load_mongo_to_postgres_dag
```

### **2. Triggering Enhanced Pipeline**

#### **Enhanced Ingestion DAG**
```python
# Trigger via Airflow API or UI
dag_run_conf = {
    "org_id": "123",                    # Required: Organization ID
    "table": "orders",                  # Required: Table name
    "file_id": "file_456",             # Required: File identifier
    "user_id": "user_789",             # Optional: User who initiated
    "client_id": "client_abc"          # Optional: Client identifier
}

# Via Airflow CLI
airflow dags trigger enhanced_org_aware_ingest_dag \
    --conf '{"org_id": "123", "table": "orders", "file_id": "file_456"}'
```

#### **Enhanced PostgreSQL Loading DAG**
```python
# Automatically triggered by ingestion DAG
# Can also be triggered manually:

dag_run_conf = {
    "triggered_by": "manual",
    "source_task": "manual_trigger"
}
```

### **3. Using the Management CLI**

#### **Installation**
```bash
cd backend/backend_scripts
chmod +x data_pipeline_manager.py
```

#### **Pipeline Status**
```bash
# Overall status
python data_pipeline_manager.py status

# Organization-specific status
python data_pipeline_manager.py status --org-id 123 --days 7
```

#### **Data Quality Reports**
```bash
# Organization-wide quality report
python data_pipeline_manager.py quality --org-id 123 --days 30

# Table-specific quality report
python data_pipeline_manager.py quality --org-id 123 --table orders --days 7
```

#### **Audit Trail**
```bash
# All changes for an organization
python data_pipeline_manager.py audit --org-id 123 --limit 100

# Specific record history
python data_pipeline_manager.py audit --org-id 123 \
    --composite-key "org_123_orders_ORD001_CUST456_2024-01-15"

# Table-specific audit trail
python data_pipeline_manager.py audit --org-id 123 --table orders --limit 50
```

#### **Performance Metrics**
```bash
# Organization metrics
python data_pipeline_manager.py metrics --org-id 123 --days 30

# All organizations overview
python data_pipeline_manager.py metrics --days 7
```

#### **Alert Management**
```bash
# All active alerts
python data_pipeline_manager.py alerts

# Organization-specific alerts
python data_pipeline_manager.py alerts --org-id 123

# Critical alerts only
python data_pipeline_manager.py alerts --severity critical
```

---

## 📊 Monitoring & Analytics

### **1. Data Quality Monitoring**

#### **Quality Scores**
- **Overall Quality**: Aggregate score across all dimensions
- **Completeness**: Percentage of non-null values
- **Consistency**: Data format and type consistency
- **Validity**: Business rule validation results

#### **Quality Tracking**
```python
# Example quality report structure
{
    "total_records": 10000,
    "records_with_errors": 15,
    "records_with_warnings": 125,
    "overall_quality_score": 0.9850,
    "completeness_score": 0.9920,
    "validity_score": 0.9985,
    "quality_issues": [
        {
            "issue_type": "missing_required_field",
            "field": "customer_id",
            "count": 5,
            "percentage": 0.05
        }
    ],
    "recommendations": [
        "Review data source for customer_id completeness",
        "Implement validation at source system"
    ]
}
```

### **2. Performance Metrics**

#### **Processing Metrics**
- **Ingestion Rate**: Records processed per minute
- **Processing Latency**: Average time from ingestion to availability
- **Error Rate**: Percentage of failed records
- **Success Rate**: Percentage of successful jobs

#### **Storage Metrics**
- **Storage Usage**: Total bytes used per organization
- **Growth Rate**: Storage growth over time
- **Efficiency**: Records per byte ratio

### **3. Audit Trail Analysis**

#### **Change Tracking**
- **Version History**: Complete history of all changes
- **Change Frequency**: Rate of data modifications
- **User Activity**: Who is making changes and when
- **Data Lineage**: Full traceability from source to destination

---

## 🔧 Advanced Configuration

### **1. Organization-Specific Settings**

#### **Schema Configuration**
Create organization-specific schemas:
```bash
# Schema file location: user_schemas/{org_id}_schema.csv
# or user_schemas/{org_id}_{table_name}_schema.csv

# Example: user_schemas/123_orders_schema.csv
column_name,data_type
org_id,TEXT NOT NULL
order_id,TEXT
customer_id,TEXT
product_id,TEXT
order_date,DATE
amount,DECIMAL(10,2)
composite_key,TEXT NOT NULL
version,INTEGER NOT NULL DEFAULT 1
# ... enhanced metadata columns automatically added
```

#### **Data Quality Rules**
Customize validation rules per organization:
```python
# In enhanced_ingest_from_minio.py
def get_required_fields_for_table(self, table_name: str) -> List[str]:
    # Customize based on organization requirements
    org_specific_rules = {
        "org_123": {
            "orders": ["order_id", "customer_id", "order_date", "amount"],
            "products": ["product_id", "product_name", "price"]
        }
    }
    return org_specific_rules.get(self.org_id, {}).get(table_name, [])
```

### **2. Performance Optimization**

#### **Parallel Processing**
```python
# Enhanced DAG supports parallel processing
dag = DAG(
    'enhanced_org_aware_ingest',
    max_active_runs=5,        # Multiple organizations simultaneously
    max_active_tasks=10,      # Parallel task execution
    concurrency=20            # Total concurrent tasks
)
```

#### **Resource Allocation**
```python
# Organization-specific resource allocation
def create_dedicated_org_dag(org_id: str, schedule: str = '@hourly'):
    """Create dedicated DAG for high-volume organizations"""
    
    # Custom resource allocation
    if org_id in HIGH_VOLUME_ORGS:
        max_active_runs = 10
        max_active_tasks = 20
    else:
        max_active_runs = 3
        max_active_tasks = 8
    
    return create_org_aware_dag(f"_org_{org_id}", schedule)
```

### **3. Data Retention Policies**

#### **Automatic Archival**
```sql
-- Archive old versions (keep last 10 versions)
WITH ranked_versions AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY org_id, composite_key 
               ORDER BY version DESC
           ) as version_rank
    FROM raw_orders
    WHERE org_id = 'org_123'
)
UPDATE raw_orders 
SET is_active = FALSE 
WHERE composite_key IN (
    SELECT composite_key 
    FROM ranked_versions 
    WHERE version_rank > 10
);
```

#### **Data Cleanup**
```python
# Cleanup old audit logs
def cleanup_old_audit_logs(org_id: str, days_to_keep: int = 365):
    cutoff_date = datetime.now() - timedelta(days=days_to_keep)
    
    DataVersionHistory.objects.filter(
        org_id=org_id,
        change_timestamp__lt=cutoff_date
    ).delete()
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Missing Composite Keys**
```bash
# Check for records without proper composite keys
python data_pipeline_manager.py audit --org-id 123 --table orders

# Look for records with missing business key fields
```

#### **2. Quality Score Degradation**
```bash
# Generate quality trend report
python data_pipeline_manager.py quality --org-id 123 --days 30

# Check for specific quality issues
python data_pipeline_manager.py alerts --org-id 123 --severity high
```

#### **3. Performance Issues**
```bash
# Check processing metrics
python data_pipeline_manager.py metrics --org-id 123 --days 7

# Look for bottlenecks in processing times
```

#### **4. Version Conflicts**
```sql
-- Check for version gaps or conflicts
SELECT composite_key, 
       array_agg(version ORDER BY version) as versions,
       COUNT(*) as version_count
FROM raw_orders 
WHERE org_id = 'org_123'
GROUP BY composite_key 
HAVING COUNT(*) > 1
ORDER BY version_count DESC;
```

### **Error Recovery**

#### **Failed Ingestion Jobs**
```bash
# Check failed jobs
python data_pipeline_manager.py status --org-id 123

# Review error details
python data_pipeline_manager.py alerts --org-id 123 --severity critical
```

#### **Data Inconsistencies**
```bash
# Validate data integrity across systems
python data_pipeline_manager.py validate --org-id 123

# Compare MongoDB vs PostgreSQL counts
```

---

## 🔮 Roadmap - Phase 2 & 3 Features

### **Phase 2: Advanced Analytics (Next 4-6 weeks)**

#### **Real-time Processing**
- [ ] Kafka/Redis integration for streaming data
- [ ] Real-time dashboard updates
- [ ] Event-driven processing triggers
- [ ] Live data quality monitoring

#### **Enhanced Monitoring**
- [ ] Prometheus/Grafana integration
- [ ] Custom dashboard creation
- [ ] Automated alerting system
- [ ] Performance optimization recommendations

#### **Self-Service Tools**
- [ ] Organization admin dashboard
- [ ] Custom query builder
- [ ] Automated report generation
- [ ] Data export with audit trails

### **Phase 3: Enterprise Features (6-8 weeks)**

#### **Advanced Analytics**
- [ ] Organization-specific ML models
- [ ] Predictive analytics enhancement
- [ ] Anomaly detection algorithms
- [ ] Custom forecasting models

#### **Data Governance**
- [ ] Policy-based data retention
- [ ] Compliance reporting
- [ ] Data privacy controls
- [ ] Automated data classification

#### **Scale Optimization**
- [ ] Horizontal scaling support
- [ ] Auto-scaling based on load
- [ ] Cross-region replication
- [ ] Performance optimization engine

---

## 📞 Support & Maintenance

### **Regular Maintenance Tasks**

#### **Daily**
```bash
# Check system status
python data_pipeline_manager.py status --days 1

# Review critical alerts
python data_pipeline_manager.py alerts --severity critical
```

#### **Weekly**
```bash
# Generate quality reports for all organizations
python data_pipeline_manager.py quality --days 7

# Review performance metrics
python data_pipeline_manager.py metrics --days 7
```

#### **Monthly**
```bash
# Comprehensive audit review
python data_pipeline_manager.py audit --days 30

# Storage and performance optimization review
python data_pipeline_manager.py metrics --days 30
```

### **System Health Checks**

#### **Database Connections**
```python
# Test MongoDB connectivity
mongo_client = MongoClient(MONGO_URI)
mongo_client.admin.command('ping')

# Test PostgreSQL connectivity for each org
for org in organizations:
    engine = get_organization_pg_engine(str(org.id))
    engine.connect().execute('SELECT 1')
```

#### **Data Quality Thresholds**
```python
# Set up automated quality alerts
QUALITY_THRESHOLDS = {
    "overall_quality_score": 0.95,
    "error_rate_percent": 1.0,
    "completeness_score": 0.98
}
```

---

## 🎉 Summary

The enhanced organization-aware data pipeline provides:

✅ **Complete Data Isolation**: Organization data cannot cross-contaminate  
✅ **Comprehensive Audit Trails**: Full visibility into data changes  
✅ **Version Control**: Track every modification with complete history  
✅ **Data Quality Monitoring**: Automated validation and quality scoring  
✅ **Performance Optimization**: Organization-specific processing and monitoring  
✅ **Scalable Architecture**: Support for thousands of organizations  
✅ **Enterprise-Ready**: Compliance, governance, and audit capabilities  

The system is production-ready and provides a solid foundation for enterprise-scale multi-tenant data processing with complete audit trails and comprehensive monitoring.

---

**For technical support or questions, contact the data platform team.**