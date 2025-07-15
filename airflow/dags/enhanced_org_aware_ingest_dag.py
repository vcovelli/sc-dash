import sys
import os
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.operators.dummy import DummyOperator
from airflow.sensors.filesystem import FileSensor
from datetime import datetime, timedelta
from typing import Dict, Any

env = os.getenv("ENV", "LOCAL")

if env == "DOCKER":
    sys.path.append('/opt/airflow/backend_scripts/airflow_tasks')
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../backend/backend_scripts/airflow_tasks")))

# Import enhanced scripts
from enhanced_ingest_from_minio import enhanced_ingest_from_minio

def validate_dag_config(**context):
    """Validate that all required configuration is present"""
    conf = context["dag_run"].conf
    
    required_fields = ['org_id', 'table', 'file_id']
    missing_fields = []
    
    for field in required_fields:
        if not conf.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Missing required configuration fields: {missing_fields}")
    
    org_id = conf.get('org_id')
    table = conf.get('table')
    file_id = conf.get('file_id')
    user_id = conf.get('user_id')
    
    print(f"[INFO] Validated configuration:")
    print(f"  - Organization ID: {org_id}")
    print(f"  - Table: {table}")
    print(f"  - File ID: {file_id}")
    print(f"  - User ID: {user_id}")
    
    # Push validated config to XCom for downstream tasks
    context["ti"].xcom_push(key="validated_config", value={
        "org_id": org_id,
        "table": table,
        "file_id": file_id,
        "user_id": user_id,
        "client_id": conf.get('client_id'),
        "validation_timestamp": datetime.now().isoformat()
    })

def check_org_permissions(**context):
    """Check if the organization has permission to perform data ingestion"""
    conf = context["dag_run"].conf
    org_id = conf.get('org_id')
    user_id = conf.get('user_id')
    
    # TODO: Add actual permission checking logic here
    # For now, we'll do basic validation
    
    if not org_id or len(org_id) < 1:
        raise ValueError(f"Invalid organization ID: {org_id}")
    
    print(f"[INFO] Organization {org_id} has permission for data ingestion")
    print(f"[INFO] Initiated by user: {user_id}")
    
    # In a real implementation, you might check:
    # - Organization subscription status
    # - Data ingestion limits
    # - User permissions within the organization
    # - Storage quotas
    
    return True

def notify_ingestion_start(**context):
    """Notify relevant systems that data ingestion has started"""
    conf = context["dag_run"].conf
    org_id = conf.get('org_id')
    table = conf.get('table')
    file_id = conf.get('file_id')
    
    print(f"[INFO] Starting data ingestion for organization {org_id}")
    print(f"[INFO] Table: {table}, File ID: {file_id}")
    
    # TODO: Send notifications (email, webhooks, dashboard updates)
    # Example:
    # - Update dashboard with "Processing" status
    # - Send webhook to organization's configured endpoint
    # - Log activity in user activity table
    
    return {
        "status": "started",
        "org_id": org_id,
        "table": table,
        "file_id": file_id,
        "start_timestamp": datetime.now().isoformat()
    }

def handle_ingestion_error(**context):
    """Handle errors during data ingestion"""
    print("[ERROR] Data ingestion failed - executing error handling")
    
    # Get error information from context
    dag_run = context.get('dag_run')
    conf = dag_run.conf if dag_run else {}
    
    org_id = conf.get('org_id', 'unknown')
    table = conf.get('table', 'unknown')
    file_id = conf.get('file_id', 'unknown')
    
    # TODO: Implement comprehensive error handling:
    # - Send error notifications to organization admins
    # - Update file status to "failed" in backend
    # - Log detailed error information
    # - Quarantine failed files for manual review
    # - Update organization dashboard with error status
    
    print(f"[ERROR] Failed ingestion details:")
    print(f"  - Organization: {org_id}")
    print(f"  - Table: {table}")
    print(f"  - File ID: {file_id}")
    
    # For now, just log the error
    # In production, you'd want to:
    # 1. Mark the file as failed in your backend
    # 2. Send notifications
    # 3. Update monitoring dashboards
    
    return {
        "status": "failed",
        "org_id": org_id,
        "table": table,
        "file_id": file_id,
        "error_timestamp": datetime.now().isoformat()
    }

def create_org_aware_dag(dag_id_suffix: str = "", schedule: str = None) -> DAG:
    """Create an organization-aware data ingestion DAG"""
    
    default_args = {
        'owner': 'data-platform',
        'depends_on_past': False,
        'start_date': datetime(2024, 1, 1),
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
        'retry_exponential_backoff': True,
        'max_retry_delay': timedelta(minutes=30),
    }

    dag_id = f'enhanced_org_aware_ingest_dag{dag_id_suffix}'
    
    dag = DAG(
        dag_id=dag_id,
        default_args=default_args,
        description='Enhanced organization-aware CSV ingestion with comprehensive audit trails',
        schedule_interval=schedule,
        catchup=False,
        max_active_runs=5,  # Allow multiple organizations to process simultaneously
        max_active_tasks=10,
        tags=['enhanced', 'org_aware', 'data_ingestion', 'multi_tenant'],
        params={
            "org_id": "",
            "table": "",
            "file_id": "",
            "user_id": "",
            "client_id": ""
        }
    )

    # Task 1: Validate DAG configuration
    validate_config = PythonOperator(
        task_id='validate_config',
        python_callable=validate_dag_config,
        provide_context=True,
        dag=dag,
    )

    # Task 2: Check organization permissions
    check_permissions = PythonOperator(
        task_id='check_org_permissions',
        python_callable=check_org_permissions,
        provide_context=True,
        dag=dag,
    )

    # Task 3: Notify ingestion start
    notify_start = PythonOperator(
        task_id='notify_ingestion_start',
        python_callable=notify_ingestion_start,
        provide_context=True,
        dag=dag,
    )

    # Task 4: Enhanced data ingestion from MinIO
    enhanced_ingestion = PythonOperator(
        task_id='enhanced_ingest_from_minio',
        python_callable=enhanced_ingest_from_minio,
        provide_context=True,
        dag=dag,
        # Enhanced error handling
        on_failure_callback=handle_ingestion_error,
    )

    # Task 5: Trigger enhanced MongoDB to PostgreSQL loading
    trigger_postgres_load = TriggerDagRunOperator(
        task_id="trigger_enhanced_postgres_load",
        trigger_dag_id="enhanced_mongo_to_postgres_dag",
        wait_for_completion=False,
        conf={
            "triggered_by": dag_id,
            "source_task": "enhanced_ingest_from_minio"
        },
        dag=dag,
    )

    # Task 6: Final cleanup and notification
    completion_notification = PythonOperator(
        task_id='notify_completion',
        python_callable=lambda **context: print(f"[SUCCESS] Enhanced ingestion completed for DAG run {context['dag_run'].run_id}"),
        provide_context=True,
        dag=dag,
    )

    # Set task dependencies with enhanced error handling
    validate_config >> check_permissions >> notify_start >> enhanced_ingestion >> trigger_postgres_load >> completion_notification

    return dag

# Create the main DAG
enhanced_org_aware_ingest_dag = create_org_aware_dag()

# You can create organization-specific DAGs if needed
# For example, for high-volume organizations that need dedicated resources
def create_dedicated_org_dag(org_id: str, schedule: str = '@hourly') -> DAG:
    """Create a dedicated DAG for a specific high-volume organization"""
    
    dag_id_suffix = f"_org_{org_id}"
    dedicated_dag = create_org_aware_dag(dag_id_suffix, schedule)
    
    # Add organization-specific optimizations
    # For example, different resource allocations, priorities, etc.
    
    return dedicated_dag

# Example: Create dedicated DAGs for specific organizations
# These would be created based on configuration or automatically for high-volume orgs
#
# high_volume_org_dag = create_dedicated_org_dag('high_volume_org_123', '@every_15_minutes')
# enterprise_org_dag = create_dedicated_org_dag('enterprise_org_456', '@hourly')

# Export the main DAG for Airflow to discover
globals()['enhanced_org_aware_ingest_dag'] = enhanced_org_aware_ingest_dag