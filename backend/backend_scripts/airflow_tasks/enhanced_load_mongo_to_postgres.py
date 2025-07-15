import os
import sys
import uuid
import pandas as pd
import hashlib
import json
from pymongo import MongoClient
from sqlalchemy import create_engine, text, MetaData, Table, Column, String, Integer, DateTime, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from typing import Dict, List, Any, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

# Configuration
MONGO_URI = os.getenv("MONGO_URI")
PG_USER = os.getenv("APP_DB_USER")
PG_PASSWORD = os.getenv("APP_DB_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
PG_DB_PREFIX = os.getenv("PG_DB_PREFIX", "orgdata_")

class EnhancedMongoToPostgres:
    """Enhanced organization-aware MongoDB to PostgreSQL data loading with comprehensive audit trails"""
    
    def __init__(self):
        self.mongo_client = MongoClient(MONGO_URI)
        self.mongo_db_name = os.getenv("MONGO_DATABASE", "client_data")
        self.mongo_db = self.mongo_client[self.mongo_db_name]
        
    def create_org_database(self, org_id: str) -> str:
        """Create organization-specific PostgreSQL database if it doesn't exist"""
        db_name = f"{PG_DB_PREFIX}{org_id}"
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user=PG_USER,
                password=PG_PASSWORD,
                host=PG_HOST,
                port=PG_PORT
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = conn.cursor()

            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            if not cur.fetchone():
                cur.execute(f"CREATE DATABASE {db_name}")
                print(f"[+] Created organization database: {db_name}")
            else:
                print(f"[=] Organization database already exists: {db_name}")

            cur.close()
            conn.close()
            return db_name
        except Exception as e:
            print(f"[!] Error creating organization database '{db_name}': {e}")
            return None
        
    def get_organization_pg_engine(self, org_id):
        """
        Return a SQLAlchemy engine for the org-specific PostgreSQL database.
        """
        db_name = f"{PG_DB_PREFIX}{org_id}"
        conn_str = f"postgresql+psycopg2://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{db_name}"
        return create_engine(conn_str)

    def load_org_schema_columns(self, org_id: str, table_name: str) -> List[Tuple[str, str]]:
        """Load organization-specific schema configuration"""
        SCHEMA_DIR = Path(os.environ.get("SCHEMA_DIR", BASE_DIR / "user_schemas"))
        schema_path = Path(SCHEMA_DIR) / f"{org_id.lower()}_{table_name}_schema.csv"
        
        # Fallback to generic org schema
        if not os.path.exists(schema_path):
            schema_path = Path(SCHEMA_DIR) / f"{org_id.lower()}_schema.csv"
        
        if not os.path.exists(schema_path):
            print(f"[WARNING] No schema found for org {org_id}, table {table_name}. Using default schema.")
            return self.get_default_schema(table_name)

        try:
            import csv
            with open(schema_path, mode='r', newline='') as file:
                reader = csv.DictReader(file)
                columns = [(row['column_name'], row['data_type']) for row in reader]
            
            # Ensure enhanced metadata columns are included
            enhanced_columns = self.get_enhanced_metadata_columns()
            for col_name, col_type in enhanced_columns:
                if col_name not in [col[0] for col in columns]:
                    columns.append((col_name, col_type))
            
            return columns
        except Exception as e:
            print(f"[ERROR] Error loading schema for org {org_id}: {e}")
            return self.get_default_schema(table_name)

    def get_default_schema(self, table_name: str) -> List[Tuple[str, str]]:
        """Get default schema if organization-specific schema is not available"""
        base_columns = [
            ('org_id', 'TEXT NOT NULL'),
            ('table_name', 'TEXT'),
            ('composite_key', 'TEXT NOT NULL'),
        ]
        
        # Table-specific columns
        if table_name == 'orders':
            base_columns.extend([
                ('order_id', 'TEXT'),
                ('customer_id', 'TEXT'),
                ('product_id', 'TEXT'),
                ('order_date', 'DATE'),
                ('quantity', 'INTEGER'),
                ('amount', 'DECIMAL(10,2)'),
            ])
        elif table_name == 'products':
            base_columns.extend([
                ('product_id', 'TEXT'),
                ('product_name', 'TEXT'),
                ('category', 'TEXT'),
                ('price', 'DECIMAL(10,2)'),
            ])
        elif table_name == 'inventory':
            base_columns.extend([
                ('product_id', 'TEXT'),
                ('location_id', 'TEXT'),
                ('quantity', 'INTEGER'),
                ('last_updated', 'TIMESTAMP'),
            ])
        else:
            # Generic columns for unknown table types
            base_columns.extend([
                ('data_id', 'TEXT'),
                ('description', 'TEXT'),
                ('value', 'TEXT'),
            ])
        
        # Add enhanced metadata columns
        base_columns.extend(self.get_enhanced_metadata_columns())
        return base_columns

    def get_enhanced_metadata_columns(self) -> List[Tuple[str, str]]:
        """Get the enhanced metadata columns for audit trails and versioning"""
        return [
            ('version', 'INTEGER NOT NULL DEFAULT 1'),
            ('data_hash', 'TEXT'),
            ('change_type', 'VARCHAR(10) DEFAULT \'INSERT\''),
            ('changed_fields', 'JSONB'),
            ('changed_by_user_id', 'TEXT'),
            ('previous_version', 'INTEGER'),
            ('audit_trail', 'JSONB'),
            ('ingested_at', 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()'),
            ('last_modified', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
            ('postgres_status', 'VARCHAR(20) DEFAULT \'pending\''),
            ('status', 'VARCHAR(20) DEFAULT \'active\''),
            ('is_active', 'BOOLEAN DEFAULT TRUE'),
            ('data_quality', 'JSONB'),
            ('source_file_metadata', 'JSONB'),
            ('processing_metadata', 'JSONB'),
        ]

    def create_enhanced_tables(self, engine, table_name: str, schema_columns: List[Tuple[str, str]]) -> bool:
        """Create enhanced tables with proper indexes and constraints"""
        
        # Main data table
        raw_table = f"raw_{table_name}"
        
        # Change log table for audit trail
        log_table = f"{raw_table}_change_log"
        
        # Data quality metrics table
        quality_table = f"{raw_table}_quality_metrics"
        
        try:
            with engine.connect() as conn:
                # Check if main table exists
                table_check = conn.execute(text(
                    f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{raw_table}');"
                )).scalar()

                if not table_check:
                    print(f"[+] Creating enhanced table structure for {raw_table}...")
                    
                    # Create main data table
                    col_defs = ",\n".join([f"{name} {dtype}" for name, dtype in schema_columns])
                    
                    # Enhanced primary key including version for true versioning
                    pk_columns = ['org_id', 'composite_key', 'version']
                    pk_def = f"PRIMARY KEY ({', '.join(pk_columns)})"
                    
                    create_stmt = f"""
                    CREATE TABLE {raw_table} (
                        {col_defs},
                        {pk_def}
                    );
                    """
                    conn.execute(text(create_stmt))
                    
                    # Create performance indexes
                    indexes = [
                        f"CREATE INDEX idx_{raw_table}_org_active ON {raw_table} (org_id, is_active);",
                        f"CREATE INDEX idx_{raw_table}_composite_latest ON {raw_table} (composite_key, version DESC);",
                        f"CREATE INDEX idx_{raw_table}_ingested_at ON {raw_table} (ingested_at);",
                        f"CREATE INDEX idx_{raw_table}_changed_by ON {raw_table} (changed_by_user_id);",
                        f"CREATE INDEX idx_{raw_table}_change_type ON {raw_table} (change_type);",
                        f"CREATE INDEX idx_{raw_table}_data_quality ON {raw_table} USING gin (data_quality);",
                    ]
                    
                    for index_stmt in indexes:
                        conn.execute(text(index_stmt))
                    
                    # Create change log table for detailed audit trail
                    conn.execute(text(f"""
                        CREATE TABLE {log_table} (
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
                    """))
                    
                    # Index for change log
                    conn.execute(text(f"""
                        CREATE INDEX idx_{log_table}_composite_key ON {log_table} (composite_key);
                        CREATE INDEX idx_{log_table}_timestamp ON {log_table} (change_timestamp);
                        CREATE INDEX idx_{log_table}_org_id ON {log_table} (org_id);
                    """))
                    
                    # Create data quality metrics table
                    conn.execute(text(f"""
                        CREATE TABLE {quality_table} (
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
                    """))
                    
                    conn.execute(text(f"""
                        CREATE INDEX idx_{quality_table}_org_timestamp ON {quality_table} (org_id, measurement_timestamp);
                    """))
                    
                    conn.commit()
                    print(f"[✓] Enhanced table structure created for {raw_table}")
                    
                else:
                    print(f"[=] Table {raw_table} already exists. Skipping creation.")
                
                return True
                
        except Exception as e:
            print(f"[!] Error creating enhanced tables: {e}")
            return False

    def calculate_quality_metrics(self, df: pd.DataFrame, org_id: str, table_name: str) -> Dict:
        """Calculate comprehensive data quality metrics"""
        total_records = len(df)
        
        if total_records == 0:
            return {
                "total_records": 0,
                "records_with_errors": 0,
                "records_with_warnings": 0,
                "average_quality_score": 0.0,
                "completeness_score": 0.0,
                "consistency_score": 0.0,
                "validity_score": 0.0
            }
        
        # Extract quality scores from data_quality column
        quality_scores = []
        error_count = 0
        warning_count = 0
        
        for _, row in df.iterrows():
            if 'data_quality' in row and pd.notna(row['data_quality']):
                try:
                    if isinstance(row['data_quality'], str):
                        quality_data = json.loads(row['data_quality'])
                    else:
                        quality_data = row['data_quality']
                    
                    score = quality_data.get('quality_score', 1.0)
                    quality_scores.append(score)
                    
                    if quality_data.get('status') == 'FAILED':
                        error_count += 1
                    elif quality_data.get('status') == 'WARNING':
                        warning_count += 1
                        
                except (json.JSONDecodeError, TypeError):
                    quality_scores.append(0.5)  # Default for unparseable quality data
            else:
                quality_scores.append(1.0)  # Default for missing quality data
        
        avg_quality_score = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        
        # Calculate completeness (non-null values)
        non_null_counts = df.count()
        total_possible = len(df) * len(df.columns)
        completeness_score = non_null_counts.sum() / total_possible if total_possible > 0 else 0.0
        
        return {
            "total_records": total_records,
            "records_with_errors": error_count,
            "records_with_warnings": warning_count,
            "average_quality_score": round(avg_quality_score, 4),
            "completeness_score": round(completeness_score, 4),
            "consistency_score": 1.0,  # Placeholder - can be enhanced
            "validity_score": round((total_records - error_count) / total_records, 4) if total_records > 0 else 0.0
        }

    def insert_quality_metrics(self, engine, org_id: str, table_name: str, 
                             quality_metrics: Dict, period_start: datetime, period_end: datetime):
        """Insert quality metrics into the quality tracking table"""
        quality_table = f"raw_{table_name}_quality_metrics"
        
        try:
            with engine.connect() as conn:
                insert_stmt = text(f"""
                    INSERT INTO {quality_table} 
                    (org_id, table_name, total_records, records_with_errors, records_with_warnings,
                     average_quality_score, quality_metrics, period_start, period_end)
                    VALUES (:org_id, :table_name, :total_records, :records_with_errors, :records_with_warnings,
                            :average_quality_score, :quality_metrics, :period_start, :period_end)
                """)
                
                conn.execute(insert_stmt, {
                    "org_id": org_id,
                    "table_name": table_name,
                    "total_records": quality_metrics["total_records"],
                    "records_with_errors": quality_metrics["records_with_errors"],
                    "records_with_warnings": quality_metrics["records_with_warnings"],
                    "average_quality_score": quality_metrics["average_quality_score"],
                    "quality_metrics": json.dumps(quality_metrics),
                    "period_start": period_start,
                    "period_end": period_end
                })
                conn.commit()
                print(f"[✓] Quality metrics recorded for {org_id}.{table_name}")
                
        except Exception as e:
            print(f"[!] Error inserting quality metrics: {e}")

    def process_org_collection(self, org_id: str, collection_name: str, table_name: str) -> Dict:
        """Process a single organization's collection with enhanced features"""
        print(f"[INFO] Processing collection: {collection_name} for org: {org_id}")
        
        collection = self.mongo_db[collection_name]
        
        # Find records that need to be processed
        query = {
            "org_id": org_id,
            "postgres_status": {"$ne": "ingested"}
        }
        
        raw_data = list(collection.find(query))
        
        if not raw_data:
            print(f"[=] No new data in {collection_name} for org {org_id}")
            return {"processed": 0, "errors": 0}

        print(f"[INFO] Found {len(raw_data)} records to process in {collection_name}")
        
        # Convert to DataFrame
        df = pd.DataFrame(raw_data)
        df.columns = df.columns.str.lower()
        
        # Ensure required columns exist
        required_columns = ['org_id', 'composite_key', 'table']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"[!] Missing required columns {missing_columns} in {collection_name}")
            return {"processed": 0, "errors": len(raw_data)}

        # Create organization database
        target_pg_db = self.create_org_database(org_id)
        if not target_pg_db:
            print(f"[!] Failed to create/access database for org {org_id}")
            return {"processed": 0, "errors": len(raw_data)}

        try:
            engine = create_engine(f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{target_pg_db}")
            
            # Load schema and create tables
            schema_columns = self.load_org_schema_columns(org_id, table_name)
            if not self.create_enhanced_tables(engine, table_name, schema_columns):
                return {"processed": 0, "errors": len(raw_data)}
            
            expected_columns = [name for name, _ in schema_columns]
            
            # Add missing columns with default values
            for col in expected_columns:
                if col not in df.columns:
                    if col in ['version']:
                        df[col] = 1
                    elif col in ['ingested_at', 'last_modified']:
                        df[col] = datetime.now(timezone.utc)
                    elif col in ['is_active']:
                        df[col] = True
                    elif col in ['postgres_status']:
                        df[col] = 'pending'
                    elif col in ['status']:
                        df[col] = 'active'
                    else:
                        df[col] = None

            # Reorder columns to match schema
            df = df.reindex(columns=expected_columns, fill_value=None)
            
            # Process versioning and change detection
            processed_records = []
            change_logs = []
            
            with engine.connect() as conn:
                # Get existing records and their versions
                raw_table = f"raw_{table_name}"
                log_table = f"{raw_table}_change_log"
                
                existing_query = text(f"""
                    SELECT composite_key, MAX(version) as max_version, 
                           data_hash, changed_by_user_id, audit_trail
                    FROM {raw_table} 
                    WHERE org_id = :org_id
                    GROUP BY composite_key, data_hash, changed_by_user_id, audit_trail
                """)
                existing_records = conn.execute(existing_query, {"org_id": org_id}).fetchall()
                existing_map = {row[0]: {
                    'max_version': row[1], 
                    'data_hash': row[2],
                    'changed_by': row[3],
                    'audit_trail': row[4]
                } for row in existing_records}

                period_start = datetime.now(timezone.utc)
                
                for _, row in df.iterrows():
                    composite_key = row['composite_key']
                    current_hash = row.get('data_hash', '')
                    
                    if composite_key in existing_map:
                        existing_info = existing_map[composite_key]
                        
                        # Check if data has changed
                        if existing_info['data_hash'] != current_hash:
                            # Data changed - create new version
                            new_version = existing_info['max_version'] + 1
                            row['version'] = new_version
                            row['change_type'] = 'UPDATE'
                            row['previous_version'] = existing_info['max_version']
                            
                            # Create change log entry
                            change_logs.append({
                                'org_id': org_id,
                                'composite_key': composite_key,
                                'old_version': existing_info['max_version'],
                                'new_version': new_version,
                                'change_type': 'UPDATE',
                                'changed_fields': row.get('changed_fields', []),
                                'changed_by_user_id': row.get('changed_by_user_id'),
                                'old_data_hash': existing_info['data_hash'],
                                'new_data_hash': current_hash,
                                'change_metadata': row.get('audit_trail', {}),
                                'source_info': row.get('source_file_metadata', {})
                            })
                        else:
                            # No change, skip this record
                            continue
                    else:
                        # New record
                        row['version'] = 1
                        row['change_type'] = 'INSERT'
                        row['previous_version'] = None
                        
                        # Create change log entry for new record
                        change_logs.append({
                            'org_id': org_id,
                            'composite_key': composite_key,
                            'old_version': None,
                            'new_version': 1,
                            'change_type': 'INSERT',
                            'changed_fields': [],
                            'changed_by_user_id': row.get('changed_by_user_id'),
                            'old_data_hash': None,
                            'new_data_hash': current_hash,
                            'change_metadata': row.get('audit_trail', {}),
                            'source_info': row.get('source_file_metadata', {})
                        })

                    processed_records.append(row)

                # Insert processed records
                if processed_records:
                    insert_df = pd.DataFrame(processed_records)
                    insert_df.to_sql(name=raw_table, con=engine, if_exists='append', index=False, method='multi')
                    print(f"[✓] Inserted {len(insert_df)} records into {target_pg_db}.{raw_table}")
                    
                    # Insert change logs
                    if change_logs:
                        log_df = pd.DataFrame(change_logs)
                        log_df['change_timestamp'] = datetime.now(timezone.utc)
                        log_df.to_sql(name=log_table, con=engine, if_exists='append', index=False, method='multi')
                        print(f"[✓] Logged {len(change_logs)} changes to {log_table}")
                    
                    # Calculate and record quality metrics
                    period_end = datetime.now(timezone.utc)
                    quality_metrics = self.calculate_quality_metrics(insert_df, org_id, table_name)
                    self.insert_quality_metrics(engine, org_id, table_name, quality_metrics, period_start, period_end)
                    
                    # Mark records as ingested in MongoDB
                    mongo_ids = [record.get('_id') for record in raw_data if record.get('_id')]
                    if mongo_ids:
                        collection.update_many(
                            {"_id": {"$in": mongo_ids}},
                            {"$set": {
                                "postgres_status": "ingested",
                                "postgres_ingested_at": datetime.now(timezone.utc),
                                "postgres_database": target_pg_db,
                                "postgres_table": raw_table,
                                "processing_uuid": str(uuid.uuid4())
                            }}
                        )
                    
                    return {"processed": len(processed_records), "errors": 0}
                else:
                    print(f"[=] No records needed processing in {collection_name}")
                    return {"processed": 0, "errors": 0}

        except Exception as e:
            print(f"[!] Error processing {collection_name} for org {org_id}: {e}")
            return {"processed": 0, "errors": len(raw_data)}

def enhanced_load_mongo_to_postgres(**context):
    """Enhanced organization-aware MongoDB to PostgreSQL loading"""
    
    processor = EnhancedMongoToPostgres()
    
    try:
        # Get processing summary from upstream task if available
        ingestion_summary = context["ti"].xcom_pull(key="ingestion_summary")
        
        total_processed = 0
        total_errors = 0
        org_summaries = {}
        
        # Process collections
        for collection_name in processor.mongo_db.list_collection_names():
            if not collection_name.startswith("raw_"):
                continue
            
            # Extract org_id and table from collection name: raw_{org_id}_{table}
            parts = collection_name.split("_", 2)
            if len(parts) >= 3:
                org_id = parts[1]
                table_name = parts[2]
            else:
                # Fallback for legacy naming: raw_{table}
                print(f"[WARNING] Legacy collection naming detected: {collection_name}")
                # Try to get org_id from the first document
                sample_doc = processor.mongo_db[collection_name].find_one({"org_id": {"$exists": True}})
                if sample_doc and "org_id" in sample_doc:
                    org_id = sample_doc["org_id"]
                    table_name = collection_name.replace("raw_", "")
                else:
                    print(f"[ERROR] Cannot determine org_id for collection {collection_name}")
                    continue
            
            print(f"[INFO] Processing organization {org_id}, table {table_name}")
            
            # Process this organization's collection
            result = processor.process_org_collection(org_id, collection_name, table_name)
            
            total_processed += result["processed"]
            total_errors += result["errors"]
            
            # Track per-organization summary
            if org_id not in org_summaries:
                org_summaries[org_id] = {"processed": 0, "errors": 0, "tables": []}
            
            org_summaries[org_id]["processed"] += result["processed"]
            org_summaries[org_id]["errors"] += result["errors"]
            org_summaries[org_id]["tables"].append(table_name)

        # Final summary
        print(f"[SUMMARY] Enhanced MongoDB to PostgreSQL loading completed:")
        print(f"  - Total records processed: {total_processed}")
        print(f"  - Total errors: {total_errors}")
        print(f"  - Organizations processed: {len(org_summaries)}")
        
        for org_id, summary in org_summaries.items():
            print(f"  - Org {org_id}: {summary['processed']} records, {summary['errors']} errors, tables: {summary['tables']}")

        # Push summary to XCom for downstream tasks
        context["ti"].xcom_push(key="postgres_load_summary", value={
            "total_processed": total_processed,
            "total_errors": total_errors,
            "org_summaries": org_summaries,
            "processing_timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # If any organization was processed, push the first org_id for backward compatibility
        if org_summaries:
            first_org_id = list(org_summaries.keys())[0]
            context["ti"].xcom_push(key="org_id", value=first_org_id)
            print(f"[✓] Pushed org_id to XCom for downstream tasks: {first_org_id}")

    except Exception as e:
        print(f"[ERROR] Enhanced MongoDB to PostgreSQL loading failed: {e}")
        raise

if __name__ == "__main__":
    enhanced_load_mongo_to_postgres()