import os
import requests
import pandas as pd
import hashlib
import json
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
import boto3
from botocore.client import Config
from io import BytesIO
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

class EnhancedDataIngestion:
    """Enhanced organization-aware data ingestion with comprehensive audit trails"""
    
    def __init__(self):
        # Load environment variables
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)
        
        # Configuration
        self.MONGO_URI = os.getenv("MONGO_URI")
        self.BACKEND_API_URL = os.getenv("BACKEND_API_URL")
        
        # MongoDB connection
        self.mongo_client = MongoClient(self.MONGO_URI)
        self.mongo_db_name = os.getenv("MONGO_DATABASE", "client_data")
        self.db = self.mongo_client[self.mongo_db_name]
        
        # MinIO / S3 config
        self.s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("MINIO_HTTP_ENDPOINT"),
            aws_access_key_id=os.getenv("MINIO_ROOT_USER"),
            aws_secret_access_key=os.getenv("MINIO_ROOT_PASSWORD"),
            config=Config(signature_version="s3v4"),
            region_name=os.getenv("MINIO_REGION", "us-east-1")
        )
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME")

    def generate_org_composite_key(self, org_id: str, record: Dict, table_name: str, business_keys: List[str]) -> str:
        """
        Generate enhanced organization-aware composite key
        Format: org_{org_id}_{table_name}_{business_keys_joined}
        """
        # Extract business key values and create a stable key
        key_values = []
        for key in business_keys:
            value = str(record.get(key, "")).strip()
            if not value or value.lower() in ['', 'nan', 'none', 'null']:
                value = "MISSING"
            key_values.append(value)
        
        business_key_part = "_".join(key_values)
        composite_key = f"org_{org_id}_{table_name}_{business_key_part}"
        
        # Ensure key length is manageable (hash if too long)
        if len(composite_key) > 255:
            key_hash = hashlib.sha256(composite_key.encode()).hexdigest()[:16]
            composite_key = f"org_{org_id}_{table_name}_{key_hash}"
        
        return composite_key

    def calculate_data_hash(self, record: Dict) -> str:
        """Calculate SHA256 hash of record data for change detection"""
        # Remove system fields from hash calculation
        data_for_hash = {k: v for k, v in record.items() 
                        if k not in ['_id', 'org_id', 'table', 'composite_key', 'postgres_status', 
                                   'status', 'ingested_at', 'version', 'data_hash', 'change_type', 
                                   'changed_fields', 'changed_by_user_id', 'source_file', 
                                   'previous_version', 'audit_trail', 'last_modified']}
        
        # Sort keys for consistent hashing
        sorted_data = json.dumps(data_for_hash, sort_keys=True, default=str)
        return hashlib.sha256(sorted_data.encode()).hexdigest()

    def detect_changed_fields(self, old_data: Dict, new_data: Dict) -> List[str]:
        """Detect which fields have changed between two records"""
        changed_fields = []
        
        # Compare only business data fields (exclude system fields)
        system_fields = {'_id', 'org_id', 'table', 'composite_key', 'postgres_status', 
                        'status', 'ingested_at', 'version', 'data_hash', 'change_type', 
                        'changed_fields', 'changed_by_user_id', 'source_file', 
                        'previous_version', 'audit_trail', 'last_modified'}
        
        all_fields = set(old_data.keys()) | set(new_data.keys())
        business_fields = all_fields - system_fields
        
        for field in business_fields:
            old_val = old_data.get(field)
            new_val = new_data.get(field)
            
            # Convert to string for comparison to handle different types
            if str(old_val) != str(new_val):
                changed_fields.append(field)
        
        return changed_fields

    def create_audit_trail(self, change_type: str, changed_fields: List[str], 
                          previous_version: Optional[int], file_metadata: Dict,
                          validation_results: Dict) -> Dict:
        """Create comprehensive audit trail metadata"""
        return {
            "change_type": change_type,
            "changed_fields": changed_fields,
            "previous_version": previous_version,
            "change_timestamp": datetime.now(timezone.utc),
            "source_file": file_metadata,
            "validation_status": validation_results.get("status", "UNKNOWN"),
            "validation_errors": validation_results.get("errors", []),
            "data_quality_score": validation_results.get("quality_score", 0.0),
            "processing_metadata": {
                "ingestion_pipeline_version": "2.0",
                "data_lineage": f"MinIO -> MongoDB -> PostgreSQL",
                "transformation_applied": []
            }
        }

    def validate_record_quality(self, record: Dict, table_name: str, org_id: str) -> Dict:
        """Perform data quality validation on a record"""
        validation_result = {
            "status": "PASSED",
            "errors": [],
            "warnings": [],
            "quality_score": 1.0
        }
        
        score_deductions = 0.0
        
        # Basic completeness checks
        if not record:
            validation_result["errors"].append("Empty record")
            validation_result["status"] = "FAILED"
            return validation_result
        
        # Check for required fields based on table type
        required_fields = self.get_required_fields_for_table(table_name)
        for field in required_fields:
            if field not in record or not record[field] or str(record[field]).strip() == '':
                validation_result["errors"].append(f"Missing required field: {field}")
                score_deductions += 0.2
        
        # Check for suspicious values
        for key, value in record.items():
            if isinstance(value, str):
                # Check for common placeholder values
                if value.lower() in ['null', 'none', 'n/a', 'na', 'undefined', 'test']:
                    validation_result["warnings"].append(f"Suspicious value in {key}: {value}")
                    score_deductions += 0.05
        
        # Calculate final quality score
        validation_result["quality_score"] = max(0.0, 1.0 - score_deductions)
        
        if validation_result["errors"]:
            validation_result["status"] = "FAILED"
        elif validation_result["warnings"]:
            validation_result["status"] = "WARNING"
        
        return validation_result

    def get_required_fields_for_table(self, table_name: str) -> List[str]:
        """Get required fields based on table type - customize per organization needs"""
        table_requirements = {
            # Original supported tables
            "orders": ["order_id", "customer_id", "order_date"],
            "products": ["product_id", "product_name"],
            "inventory": ["product_id", "location_id", "quantity"],
            "customers": ["customer_id", "customer_name"],
            
            # Additional common business tables
            "sales": ["sale_id", "customer_id", "product_id", "sale_date"],
            "employees": ["employee_id", "name", "department"],
            "suppliers": ["supplier_id", "supplier_name"],
            "transactions": ["transaction_id", "amount", "date"],
            "invoices": ["invoice_id", "customer_id", "total"],
            "shipments": ["shipment_id", "order_id", "tracking_number"],
            
            # Allow "unknown" tables with minimal validation
            "unknown": []  # Permissive for unknown table types
        }
        
        # Log unknown table types for debugging
        if table_name not in table_requirements:
            print(f"[WARNING] Unrecognized table type: '{table_name}'. Consider adding validation rules.")
            print(f"[INFO] Available table types: {list(table_requirements.keys())}")
            return []  # Permissive - allow any fields for unrecognized tables
        
        return table_requirements.get(table_name, [])

    def insert_versioned_record(self, collection, record: Dict, version: int, 
                               changed_fields: List[str], user_id: Optional[str], 
                               data_hash: str, previous_version: Optional[int],
                               file_metadata: Dict, validation_results: Dict) -> None:
        """Insert a new version of a record with comprehensive metadata"""
        
        # Create audit trail
        change_type = "INSERT" if version == 1 else "UPDATE"
        audit_trail = self.create_audit_trail(
            change_type, changed_fields, previous_version, 
            file_metadata, validation_results
        )
        
        # Enhanced record structure
        enhanced_record = {
            **record,  # Original business data
            "version": version,
            "data_hash": data_hash,
            "change_type": change_type,
            "changed_fields": changed_fields,
            "changed_by_user_id": user_id,
            "previous_version": previous_version,
            "audit_trail": audit_trail,
            "ingested_at": datetime.now(timezone.utc),
            "last_modified": datetime.now(timezone.utc),
            "postgres_status": "pending",
            "status": "ingested",
            "is_active": True,
            "data_quality": validation_results
        }
        
        # Insert the record
        collection.insert_one(enhanced_record)

def enhanced_ingest_from_minio(**context):
    """Enhanced organization-aware data ingestion with comprehensive versioning"""
    
    ingestion = EnhancedDataIngestion()
    
    # Extract configuration from DAG context
    conf = context["dag_run"].conf
    file_id = conf.get("file_id")
    org_id = conf.get("org_id")
    client_id = conf.get("client_id")
    table = conf.get("table")
    user_id = conf.get("user_id")  # Track who initiated the ingestion
    
    # Validation
    if not file_id:
        raise ValueError("No file_id provided in dag_run.conf")
    if not org_id:
        raise ValueError("No org_id provided in dag_run.conf")
    if not table:
        raise ValueError("No table name provided in dag_run.conf")

    print(f"[INFO] Starting enhanced ingestion for org_id={org_id}, table={table}, file_id={file_id}")

    try:
        paginator = ingestion.s3.get_paginator("list_objects_v2")
        pages = paginator.paginate(Bucket=ingestion.bucket_name)

        total_processed = 0
        total_inserted = 0
        total_updated = 0
        total_errors = 0

        for page in pages:
            for obj in page.get("Contents", []):
                key = obj["Key"]
                if not key.endswith(".csv"):
                    continue
                if "archive/" in key:
                    continue

                print(f"[INFO] Processing file: {key}")

                # File metadata for audit trail
                file_metadata = {
                    "filename": key,
                    "file_size": obj.get("Size", 0),
                    "last_modified": obj.get("LastModified"),
                    "file_id": file_id,
                    "processed_timestamp": datetime.now(timezone.utc)
                }

                # Organization-specific collection
                collection_name = f"raw_{org_id}_{table}"
                collection = ingestion.db[collection_name]

                # Read from S3
                response = ingestion.s3.get_object(Bucket=ingestion.bucket_name, Key=key)
                df = pd.read_csv(BytesIO(response['Body'].read()))

                # Normalize column names
                original_cols = df.columns.tolist()
                df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
                print(f"[INFO] Normalized columns: {original_cols} -> {df.columns.tolist()}")

                if df.empty:
                    print(f"[WARNING] Empty CSV file: {key}")
                    continue

                row_count = len(df)
                total_processed += row_count

                # Inject organization metadata
                df["org_id"] = org_id
                df["table"] = table
                if client_id is not None:
                    df["client_id"] = client_id

                # Determine business keys for composite key generation
                id_cols = [col for col in df.columns if col.endswith('_id') and col != "client_id"]
                if not id_cols:
                    print(f"[WARNING] No _id columns found in '{key}'. Using first 3 columns as business keys.")
                    non_system_cols = [c for c in df.columns if c not in ["client_id", "org_id", "table"]]
                    id_cols = non_system_cols[:3] if len(non_system_cols) >= 3 else non_system_cols

                if not id_cols:
                    print(f"[ERROR] No suitable columns for business keys in '{key}'")
                    total_errors += row_count
                    continue

                print(f"[INFO] Using business keys: {id_cols}")

                # Create composite keys and ensure uniqueness index
                for idx, record in df.iterrows():
                    record_dict = record.to_dict()
                    
                    # Generate enhanced composite key
                    composite_key = ingestion.generate_org_composite_key(org_id, record_dict, table, id_cols)
                    record_dict["composite_key"] = composite_key

                    # Data quality validation
                    validation_results = ingestion.validate_record_quality(record_dict, table, org_id)
                    
                    # Skip records that fail critical validation
                    if validation_results["status"] == "FAILED":
                        print(f"[ERROR] Record failed validation: {validation_results['errors']}")
                        total_errors += 1
                        continue

                    # Calculate data hash for change detection
                    data_hash = ingestion.calculate_data_hash(record_dict)

                    # Check for existing record versions
                    existing_records = list(collection.find({
                        "composite_key": composite_key
                    }).sort("version", -1).limit(1))

                    if existing_records:
                        latest_record = existing_records[0]
                        
                        # Check if data has actually changed
                        if latest_record.get("data_hash") != data_hash:
                            # Data changed - create new version
                            new_version = latest_record.get("version", 1) + 1
                            changed_fields = ingestion.detect_changed_fields(latest_record, record_dict)
                            
                            print(f"[INFO] Data changed for key {composite_key}, creating version {new_version}")
                            print(f"[INFO] Changed fields: {changed_fields}")
                            
                            ingestion.insert_versioned_record(
                                collection, record_dict, new_version, changed_fields,
                                user_id, data_hash, latest_record.get("version"),
                                file_metadata, validation_results
                            )
                            total_updated += 1
                        else:
                            print(f"[INFO] No changes detected for key {composite_key}, skipping")
                    else:
                        # New record - insert as version 1
                        print(f"[INFO] New record with key {composite_key}")
                        ingestion.insert_versioned_record(
                            collection, record_dict, 1, [], user_id, data_hash, None,
                            file_metadata, validation_results
                        )
                        total_inserted += 1

                # Create indexes for performance
                collection.create_index("composite_key", unique=False)  # Not unique since we have versions
                collection.create_index([("composite_key", 1), ("version", -1)])
                collection.create_index([("org_id", 1), ("is_active", 1)])
                collection.create_index("ingested_at")

                print(f"[INFO] Processed file '{key}': {row_count} records")

                # Archive the file
                archive_key = f"archive/{key}"
                ingestion.s3.copy_object(
                    Bucket=ingestion.bucket_name, 
                    CopySource={'Bucket': ingestion.bucket_name, 'Key': key}, 
                    Key=archive_key
                )
                ingestion.s3.delete_object(Bucket=ingestion.bucket_name, Key=key)
                print(f"[INFO] Archived file to {archive_key}")

        # Final summary
        print(f"[SUMMARY] Enhanced ingestion completed:")
        print(f"  - Total records processed: {total_processed}")
        print(f"  - New records inserted: {total_inserted}")
        print(f"  - Records updated: {total_updated}")
        print(f"  - Records with errors: {total_errors}")

        # Notify backend about completion
        try:
            # Try different token strategies
            token = os.getenv("AIRFLOW_MARK_SUCCESS_TOKEN")
            headers = {"Content-Type": "application/json"}
            
            if token:
                headers["Authorization"] = f"Bearer {token}"
            else:
                print("[WARNING] No AIRFLOW_MARK_SUCCESS_TOKEN found, attempting without authentication")

            backend_url = ingestion.BACKEND_API_URL or os.getenv("BACKEND_API_URL", "http://backend:8000")
            endpoint = f"{backend_url}/api/files/mark-success/"
            
            print(f"[INFO] Notifying backend at: {endpoint}")

            response = requests.post(
                endpoint,
                json={
                    "file_id": file_id,
                    "row_count": total_processed,
                    "inserted_count": total_inserted,
                    "updated_count": total_updated,
                    "error_count": total_errors,
                    "processing_summary": {
                        "enhanced_pipeline": True,
                        "org_id": org_id,
                        "table": table,
                        "ingestion_timestamp": datetime.now(timezone.utc).isoformat()
                    }
                },
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"[INFO] Successfully notified backend about ingestion completion")
            else:
                print(f"[WARNING] Failed to notify backend - Status: {response.status_code}")
                print(f"[WARNING] Response: {response.text}")
                try:
                    error_data = response.json()
                    print(f"[WARNING] Error details: {error_data}")
                except:
                    pass
        except Exception as notify_err:
            print(f"[ERROR] Error notifying backend: {notify_err}")
            import traceback
            traceback.print_exc()

        # Push summary to XCom for downstream tasks
        context["ti"].xcom_push(key="ingestion_summary", value={
            "org_id": org_id,
            "table": table,
            "total_processed": total_processed,
            "total_inserted": total_inserted,
            "total_updated": total_updated,
            "total_errors": total_errors,
            "collection_name": collection_name
        })

    except Exception as e:
        print(f"[ERROR] Enhanced ingestion failed: {e}")
        raise

if __name__ == "__main__":
    # For testing
    enhanced_ingest_from_minio()