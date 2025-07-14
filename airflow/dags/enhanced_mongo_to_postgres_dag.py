import os
import sys
from airflow import DAG
from airflow.operators.python import PythonOperator, ShortCircuitOperator
from airflow.api.common.experimental.trigger_dag import trigger_dag
from datetime import datetime, timedelta

# Add path to backend_scripts so Python can find function
sys.path.append('/opt/airflow/backend_scripts/airflow_tasks')
from enhanced_load_mongo_to_postgres import enhanced_load_mongo_to_postgres

def validate_postgres_load_config(**context):
    """Validate configuration for PostgreSQL loading"""
    print("[INFO] Validating PostgreSQL load configuration")
    
    # Check for upstream data from ingestion task
    ingestion_summary = context["ti"].xcom_pull(key="ingestion_summary")
    if ingestion_summary:
        print(f"[INFO] Found ingestion summary: {ingestion_summary}")
        return True
    
    # Check DAG run configuration
    conf = context["dag_run"].conf
    triggered_by = conf.get("triggered_by", "unknown")
    source_task = conf.get("source_task", "unknown")
    
    print(f"[INFO] PostgreSQL load triggered by: {triggered_by}")
    print(f"[INFO] Source task: {source_task}")
    
    return True

def check_mongodb_data_availability(**context):
    """Check if there's data available in MongoDB for processing"""
    from enhanced_load_mongo_to_postgres import EnhancedMongoToPostgres
    
    processor = EnhancedMongoToPostgres()
    
    # Count collections with pending data
    pending_collections = []
    total_pending_records = 0
    
    for collection_name in processor.mongo_db.list_collection_names():
        if not collection_name.startswith("raw_"):
            continue
        
        collection = processor.mongo_db[collection_name]
        pending_count = collection.count_documents({
            "postgres_status": {"$ne": "ingested"}
        })
        
        if pending_count > 0:
            pending_collections.append({
                "collection": collection_name,
                "pending_records": pending_count
            })
            total_pending_records += pending_count
    
    print(f"[INFO] Found {len(pending_collections)} collections with pending data")
    print(f"[INFO] Total pending records: {total_pending_records}")
    
    if pending_collections:
        for collection_info in pending_collections:
            print(f"  - {collection_info['collection']}: {collection_info['pending_records']} records")
    
    # Push data availability info to XCom
    context["ti"].xcom_push(key="data_availability", value={
        "pending_collections": pending_collections,
        "total_pending_records": total_pending_records,
        "has_data": total_pending_records > 0
    })
    
    # Return True if there's data to process
    return total_pending_records > 0

def check_should_trigger_forecast(**context):
    """Check if forecast DAG should be triggered based on processed data"""
    postgres_summary = context["ti"].xcom_pull(key="postgres_load_summary")
    
    if not postgres_summary:
        print("[INFO] No PostgreSQL load summary found")
        return False
    
    total_processed = postgres_summary.get("total_processed", 0)
    org_summaries = postgres_summary.get("org_summaries", {})
    
    print(f"[INFO] PostgreSQL load summary:")
    print(f"  - Total processed: {total_processed}")
    print(f"  - Organizations: {len(org_summaries)}")
    
    if total_processed > 0 and org_summaries:
        print("[INFO] Data was processed - triggering forecast DAG")
        
        # Push information about which organizations need forecasting
        context["ti"].xcom_push(key="forecast_orgs", value=list(org_summaries.keys()))
        return True
    else:
        print("[INFO] No data processed - skipping forecast DAG")
        return False

def trigger_enhanced_forecast_dag(**context):
    """Trigger enhanced forecast DAG for processed organizations"""
    postgres_summary = context["ti"].xcom_pull(key="postgres_load_summary")
    
    if not postgres_summary:
        print("[WARNING] No PostgreSQL load summary found")
        return
    
    org_summaries = postgres_summary.get("org_summaries", {})
    
    for org_id, summary in org_summaries.items():
        if summary["processed"] > 0:
            print(f"[INFO] Triggering forecast for organization {org_id}")
            
            try:
                # Trigger forecast DAG for each organization that had data processed
                trigger_dag(
                    dag_id="forecast_inventory_dag",
                    conf={
                        "org_id": org_id,
                        "tables_processed": summary["tables"],
                        "records_processed": summary["processed"],
                        "triggered_by": "enhanced_mongo_to_postgres_dag",
                        "processing_timestamp": postgres_summary.get("processing_timestamp")
                    },
                    execution_date=None,
                    replace_microseconds=False,
                )
                print(f"[✓] Triggered forecast_inventory_dag for organization: {org_id}")
                
            except Exception as e:
                print(f"[ERROR] Failed to trigger forecast for org {org_id}: {e}")

def calculate_processing_metrics(**context):
    """Calculate and log processing metrics"""
    postgres_summary = context["ti"].xcom_pull(key="postgres_load_summary")
    data_availability = context["ti"].xcom_pull(key="data_availability")
    
    if not postgres_summary:
        print("[WARNING] No processing summary available")
        return
    
    total_processed = postgres_summary.get("total_processed", 0)
    total_errors = postgres_summary.get("total_errors", 0)
    org_summaries = postgres_summary.get("org_summaries", {})
    
    initial_pending = data_availability.get("total_pending_records", 0) if data_availability else 0
    
    # Calculate metrics
    processing_efficiency = (total_processed / initial_pending * 100) if initial_pending > 0 else 0
    error_rate = (total_errors / (total_processed + total_errors) * 100) if (total_processed + total_errors) > 0 else 0
    
    metrics = {
        "total_records_processed": total_processed,
        "total_errors": total_errors,
        "organizations_processed": len(org_summaries),
        "processing_efficiency_percent": round(processing_efficiency, 2),
        "error_rate_percent": round(error_rate, 2),
        "initial_pending_records": initial_pending,
        "processing_timestamp": postgres_summary.get("processing_timestamp"),
        "org_details": org_summaries
    }
    
    print(f"[METRICS] Processing Summary:")
    print(f"  - Records Processed: {total_processed}")
    print(f"  - Errors: {total_errors}")
    print(f"  - Organizations: {len(org_summaries)}")
    print(f"  - Processing Efficiency: {processing_efficiency:.2f}%")
    print(f"  - Error Rate: {error_rate:.2f}%")
    
    # Push metrics to XCom for monitoring systems
    context["ti"].xcom_push(key="processing_metrics", value=metrics)
    
    # TODO: Send metrics to monitoring systems
    # - Send to Prometheus/Grafana
    # - Update organization dashboards
    # - Log to audit system
    
    return metrics

def cleanup_and_notify(**context):
    """Perform cleanup tasks and send notifications"""
    postgres_summary = context["ti"].xcom_pull(key="postgres_load_summary")
    processing_metrics = context["ti"].xcom_pull(key="processing_metrics")
    
    if postgres_summary:
        org_summaries = postgres_summary.get("org_summaries", {})
        
        print("[INFO] Sending completion notifications...")
        
        for org_id, summary in org_summaries.items():
            if summary["processed"] > 0:
                print(f"[INFO] Org {org_id}: Processed {summary['processed']} records from tables {summary['tables']}")
                
                # TODO: Send organization-specific notifications
                # - Email to org admins
                # - Update org dashboard
                # - Webhook to org's configured endpoint
                # - Log in user activity table
    
    # TODO: Cleanup tasks
    # - Archive old log entries
    # - Clean up temporary collections
    # - Update monitoring dashboards
    
    print("[✓] Enhanced MongoDB to PostgreSQL processing completed")

# Enhanced DAG definition
default_args = {
    'owner': 'data-platform',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=20),
}

with DAG(
    dag_id='enhanced_mongo_to_postgres_dag',
    default_args=default_args,
    description='Enhanced organization-aware MongoDB to PostgreSQL loading with comprehensive audit trails',
    schedule_interval=None,  # Triggered by upstream DAG
    catchup=False,
    max_active_runs=3,  # Allow multiple runs for different organizations
    max_active_tasks=8,
    tags=['enhanced', 'org_aware', 'mongodb', 'postgresql', 'data_loading'],
) as dag:

    # Task 1: Validate configuration
    validate_config = PythonOperator(
        task_id='validate_config',
        python_callable=validate_postgres_load_config,
        provide_context=True
    )

    # Task 2: Check data availability in MongoDB
    check_data_availability = ShortCircuitOperator(
        task_id='check_data_availability',
        python_callable=check_mongodb_data_availability,
        provide_context=True
    )

    # Task 3: Enhanced MongoDB to PostgreSQL loading
    postgres_load_task = PythonOperator(
        task_id='enhanced_load_mongo_to_postgres',
        python_callable=enhanced_load_mongo_to_postgres,
        provide_context=True
    )

    # Task 4: Calculate processing metrics
    calculate_metrics = PythonOperator(
        task_id='calculate_processing_metrics',
        python_callable=calculate_processing_metrics,
        provide_context=True
    )

    # Task 5: Check if forecast should be triggered
    check_forecast_trigger = ShortCircuitOperator(
        task_id='check_should_trigger_forecast',
        python_callable=check_should_trigger_forecast,
        provide_context=True
    )

    # Task 6: Trigger forecast DAG for processed organizations
    trigger_forecast = PythonOperator(
        task_id="trigger_enhanced_forecast_dag",
        python_callable=trigger_enhanced_forecast_dag,
        provide_context=True
    )

    # Task 7: Cleanup and notifications
    cleanup_notify = PythonOperator(
        task_id='cleanup_and_notify',
        python_callable=cleanup_and_notify,
        provide_context=True
    )

    # Define task dependencies
    validate_config >> check_data_availability >> postgres_load_task >> calculate_metrics
    calculate_metrics >> check_forecast_trigger >> trigger_forecast
    calculate_metrics >> cleanup_notify

# Export the DAG
globals()['enhanced_mongo_to_postgres_dag'] = dag