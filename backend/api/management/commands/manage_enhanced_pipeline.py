import os
import sys
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from pathlib import Path

# Add path to backend_scripts
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(BASE_DIR / 'backend_scripts'))

from data_pipeline_manager import EnhancedDataPipelineManager


class Command(BaseCommand):
    help = 'Enhanced data pipeline management for Airflow integration'

    def add_arguments(self, parser):
        parser.add_argument(
            'command',
            choices=['status', 'trigger-ingest', 'trigger-postgres-load', 'trigger-forecast', 'quality', 'audit'],
            help='Pipeline command to execute'
        )
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization ID for org-specific operations'
        )
        parser.add_argument(
            '--table',
            type=str,
            help='Table name for table-specific operations'
        )
        parser.add_argument(
            '--file-id',
            type=str,
            help='File ID for ingestion operations'
        )
        parser.add_argument(
            '--user-id',
            type=str,
            help='User ID for operations'
        )
        parser.add_argument(
            '--client-id',
            type=str,
            help='Client ID for forecasting operations'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days for time-based operations'
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Verbose output'
        )

    def handle(self, *args, **options):
        try:
            manager = EnhancedDataPipelineManager()
            command = options['command']
            
            if command == 'status':
                self.handle_status(manager, options)
            elif command == 'trigger-ingest':
                self.handle_trigger_ingest(manager, options)
            elif command == 'trigger-postgres-load':
                self.handle_trigger_postgres_load(manager, options)
            elif command == 'trigger-forecast':
                self.handle_trigger_forecast(manager, options)
            elif command == 'quality':
                self.handle_quality(manager, options)
            elif command == 'audit':
                self.handle_audit(manager, options)
            else:
                raise CommandError(f'Unknown command: {command}')
                
        except Exception as e:
            raise CommandError(f'Pipeline operation failed: {str(e)}')

    def handle_status(self, manager, options):
        """Show pipeline status"""
        org_id = options.get('org_id')
        
        if org_id:
            self.stdout.write(f"Pipeline status for organization {org_id}:")
            # Get org-specific status
            status_data = manager.get_organization_status(org_id)
        else:
            self.stdout.write("Overall pipeline status:")
            # Get general status
            status_data = manager.get_overall_status()
        
        self.stdout.write(self.style.SUCCESS(f"Status: {status_data}"))

    def handle_trigger_ingest(self, manager, options):
        """Trigger enhanced ingest DAG"""
        required_fields = ['org_id', 'table', 'file_id']
        for field in required_fields:
            if not options.get(field.replace('-', '_')):
                raise CommandError(f'--{field} is required for ingest operations')
        
        org_id = options['org_id']
        table = options['table']
        file_id = options['file_id']
        user_id = options.get('user_id')
        
        self.stdout.write(f"Triggering enhanced ingest for org {org_id}, table {table}, file {file_id}")
        
        # Use the data pipeline manager to trigger the DAG
        result = manager.trigger_enhanced_ingest_dag(
            org_id=org_id,
            table=table,
            file_id=file_id,
            user_id=user_id
        )
        
        if result.get('success'):
            self.stdout.write(self.style.SUCCESS(f"Ingest DAG triggered successfully: {result['dag_run_id']}"))
        else:
            raise CommandError(f"Failed to trigger ingest DAG: {result.get('error')}")

    def handle_trigger_postgres_load(self, manager, options):
        """Trigger enhanced MongoDB to PostgreSQL load"""
        org_id = options.get('org_id')
        table = options.get('table')
        
        self.stdout.write(f"Triggering PostgreSQL load for org {org_id}, table {table or 'all'}")
        
        result = manager.trigger_postgres_load_dag(
            org_id=org_id,
            table=table
        )
        
        if result.get('success'):
            self.stdout.write(self.style.SUCCESS(f"PostgreSQL load DAG triggered successfully: {result['dag_run_id']}"))
        else:
            raise CommandError(f"Failed to trigger PostgreSQL load DAG: {result.get('error')}")

    def handle_trigger_forecast(self, manager, options):
        """Trigger inventory forecasting"""
        client_id = options.get('client_id')
        if not client_id:
            raise CommandError('--client-id is required for forecasting operations')
        
        self.stdout.write(f"Triggering inventory forecast for client {client_id}")
        
        result = manager.trigger_forecast_dag(client_id=client_id)
        
        if result.get('success'):
            self.stdout.write(self.style.SUCCESS(f"Forecast DAG triggered successfully: {result['dag_run_id']}"))
        else:
            raise CommandError(f"Failed to trigger forecast DAG: {result.get('error')}")

    def handle_quality(self, manager, options):
        """Generate data quality reports"""
        org_id = options.get('org_id')
        table = options.get('table')
        days = options.get('days', 7)
        
        if not org_id:
            raise CommandError('--org-id is required for quality reports')
        
        self.stdout.write(f"Generating quality report for org {org_id}, table {table or 'all'}, last {days} days")
        
        quality_report = manager.generate_quality_report(
            org_id=org_id,
            table_name=table,
            days=days
        )
        
        self.stdout.write(self.style.SUCCESS("Quality Report:"))
        for key, value in quality_report.items():
            self.stdout.write(f"  {key}: {value}")

    def handle_audit(self, manager, options):
        """Show audit trails"""
        org_id = options.get('org_id')
        
        if not org_id:
            raise CommandError('--org-id is required for audit operations')
        
        self.stdout.write(f"Showing audit trail for org {org_id}")
        
        audit_data = manager.get_audit_trail(org_id=org_id)
        
        self.stdout.write(self.style.SUCCESS("Audit Trail:"))
        for entry in audit_data:
            self.stdout.write(f"  {entry}")