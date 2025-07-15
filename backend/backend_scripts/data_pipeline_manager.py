#!/usr/bin/env python3
"""
Enhanced Data Pipeline Management Script

This script provides comprehensive tools for managing organization-aware data pipelines,
including monitoring, quality assessment, audit trails, and performance optimization.

Usage:
    python data_pipeline_manager.py [command] [options]

Commands:
    status          - Show pipeline status for organization(s)
    quality         - Generate data quality reports
    audit           - Show audit trails and version history
    metrics         - Display performance metrics
    alerts          - Manage data alerts
    cleanup         - Perform maintenance and cleanup tasks
    validate        - Validate data integrity across systems

Examples:
    python data_pipeline_manager.py status --org-id 123
    python data_pipeline_manager.py quality --org-id 123 --table orders --days 7
    python data_pipeline_manager.py audit --org-id 123 --composite-key "org_123_orders_ORD001"
"""

import os
import sys
import argparse
import json
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from pathlib import Path

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from pymongo import MongoClient
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Import Django models
from accounts.models import Organization, CustomUser
from datagrid.models import (
    DataIngestionJob, DataLineage, DataQualityReport, 
    DataVersionHistory, OrganizationDataMetrics, DataAlert
)

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

class DataPipelineManager:
    """Comprehensive data pipeline management and monitoring"""
    
    def __init__(self):
        # MongoDB connection
        self.mongo_client = MongoClient(os.getenv("MONGO_URI"))
        self.mongo_db = self.mongo_client[os.getenv("MONGO_DATABASE", "client_data")]
        
        # PostgreSQL connection info
        self.pg_user = os.getenv("APP_DB_USER")
        self.pg_password = os.getenv("APP_DB_PASSWORD")
        self.pg_host = os.getenv("PG_HOST")
        self.pg_port = os.getenv("PG_PORT")
        self.pg_db_prefix = os.getenv("PG_DB_PREFIX", "orgdata_")
    
    def get_organization_pg_engine(self, org_id: str):
        """Get PostgreSQL engine for specific organization"""
        db_name = f"{self.pg_db_prefix}{org_id}"
        return create_engine(f"postgresql://{self.pg_user}:{self.pg_password}@{self.pg_host}:{self.pg_port}/{db_name}")
    
    def show_pipeline_status(self, org_id: Optional[str] = None, days: int = 7) -> Dict:
        """Show comprehensive pipeline status"""
        print("=" * 80)
        print("📊 DATA PIPELINE STATUS REPORT")
        print("=" * 80)
        
        # Filter organizations
        if org_id:
            try:
                orgs = [Organization.objects.get(id=org_id)]
            except Organization.DoesNotExist:
                print(f"❌ Organization {org_id} not found")
                return {}
        else:
            orgs = Organization.objects.all()[:10]  # Limit to first 10 for overview
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        overall_stats = {
            "organizations": len(orgs),
            "total_jobs": 0,
            "successful_jobs": 0,
            "failed_jobs": 0,
            "total_records": 0,
            "avg_quality_score": 0.0
        }
        
        org_summaries = []
        
        for org in orgs:
            print(f"\n🏢 Organization: {org.name} (ID: {org.id})")
            print("-" * 60)
            
            # Recent ingestion jobs
            recent_jobs = DataIngestionJob.objects.filter(
                org=org,
                created_at__gte=cutoff_date
            ).order_by('-created_at')
            
            successful_jobs = recent_jobs.filter(status='completed').count()
            failed_jobs = recent_jobs.filter(status='failed').count()
            total_jobs = recent_jobs.count()
            
            print(f"📈 Ingestion Jobs (Last {days} days):")
            print(f"   Total: {total_jobs}")
            print(f"   Successful: {successful_jobs}")
            print(f"   Failed: {failed_jobs}")
            if total_jobs > 0:
                print(f"   Success Rate: {(successful_jobs/total_jobs)*100:.1f}%")
            
            # Data quality metrics
            recent_quality = DataQualityReport.objects.filter(
                org=org,
                report_date__gte=cutoff_date.date()
            )
            
            if recent_quality.exists():
                avg_quality = recent_quality.aggregate(
                    avg_score=models.Avg('overall_quality_score')
                )['avg_score'] or 0.0
                
                total_records = sum(qr.total_records for qr in recent_quality)
                total_errors = sum(qr.records_with_errors for qr in recent_quality)
                
                print(f"\n📊 Data Quality:")
                print(f"   Average Quality Score: {avg_quality:.3f}")
                print(f"   Total Records Processed: {total_records:,}")
                print(f"   Records with Errors: {total_errors:,}")
                if total_records > 0:
                    print(f"   Error Rate: {(total_errors/total_records)*100:.2f}%")
            
            # MongoDB collections
            org_collections = [name for name in self.mongo_db.list_collection_names() 
                             if name.startswith(f"raw_{org.id}_")]
            
            print(f"\n🗄️  Data Storage:")
            print(f"   MongoDB Collections: {len(org_collections)}")
            
            # Check PostgreSQL database
            try:
                pg_engine = self.get_organization_pg_engine(str(org.id))
                with pg_engine.connect() as conn:
                    tables_result = conn.execute(text("""
                        SELECT table_name FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name LIKE 'raw_%'
                    """))
                    pg_tables = [row[0] for row in tables_result]
                    print(f"   PostgreSQL Tables: {len(pg_tables)}")
            except Exception as e:
                print(f"   PostgreSQL: ❌ Connection failed")
            
            # Recent alerts
            recent_alerts = DataAlert.objects.filter(
                org=org,
                created_at__gte=cutoff_date,
                status__in=['open', 'acknowledged']
            )
            
            if recent_alerts.exists():
                critical_alerts = recent_alerts.filter(severity='critical').count()
                high_alerts = recent_alerts.filter(severity='high').count()
                
                print(f"\n🚨 Active Alerts:")
                print(f"   Critical: {critical_alerts}")
                print(f"   High: {high_alerts}")
                print(f"   Total: {recent_alerts.count()}")
            
            # Update overall stats
            overall_stats["total_jobs"] += total_jobs
            overall_stats["successful_jobs"] += successful_jobs
            overall_stats["failed_jobs"] += failed_jobs
            
            org_summary = {
                "org_id": org.id,
                "org_name": org.name,
                "total_jobs": total_jobs,
                "successful_jobs": successful_jobs,
                "failed_jobs": failed_jobs,
                "mongodb_collections": len(org_collections),
                "postgresql_tables": len(pg_tables) if 'pg_tables' in locals() else 0
            }
            org_summaries.append(org_summary)
        
        # Overall summary
        print("\n" + "=" * 80)
        print("📋 OVERALL SUMMARY")
        print("=" * 80)
        print(f"Organizations: {overall_stats['organizations']}")
        print(f"Total Jobs: {overall_stats['total_jobs']}")
        print(f"Success Rate: {(overall_stats['successful_jobs']/max(overall_stats['total_jobs'], 1))*100:.1f}%")
        
        return {
            "overall_stats": overall_stats,
            "org_summaries": org_summaries,
            "report_timestamp": datetime.now().isoformat()
        }
    
    def generate_quality_report(self, org_id: str, table_name: Optional[str] = None, days: int = 30) -> Dict:
        """Generate comprehensive data quality report"""
        print("=" * 80)
        print("🔍 DATA QUALITY REPORT")
        print("=" * 80)
        
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            print(f"❌ Organization {org_id} not found")
            return {}
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        print(f"🏢 Organization: {org.name}")
        print(f"📅 Period: {cutoff_date.date()} to {datetime.now().date()}")
        if table_name:
            print(f"📊 Table: {table_name}")
        print("-" * 80)
        
        # Quality reports from Django models
        quality_filter = {
            'org': org,
            'report_date__gte': cutoff_date.date()
        }
        if table_name:
            quality_filter['table_name'] = table_name
        
        quality_reports = DataQualityReport.objects.filter(**quality_filter).order_by('-report_date')
        
        if not quality_reports.exists():
            print("⚠️  No quality reports found for the specified period")
            return {}
        
        # Aggregate metrics
        total_records = sum(qr.total_records for qr in quality_reports)
        total_errors = sum(qr.records_with_errors for qr in quality_reports)
        total_warnings = sum(qr.records_with_warnings for qr in quality_reports)
        
        avg_overall_score = sum(float(qr.overall_quality_score) for qr in quality_reports) / len(quality_reports)
        avg_completeness = sum(float(qr.completeness_score) for qr in quality_reports) / len(quality_reports)
        avg_validity = sum(float(qr.validity_score) for qr in quality_reports) / len(quality_reports)
        
        print(f"📊 AGGREGATE METRICS:")
        print(f"   Total Records: {total_records:,}")
        print(f"   Records with Errors: {total_errors:,} ({(total_errors/max(total_records,1))*100:.2f}%)")
        print(f"   Records with Warnings: {total_warnings:,} ({(total_warnings/max(total_records,1))*100:.2f}%)")
        print(f"\n🎯 QUALITY SCORES:")
        print(f"   Overall Quality: {avg_overall_score:.3f}")
        print(f"   Completeness: {avg_completeness:.3f}")
        print(f"   Validity: {avg_validity:.3f}")
        
        # Table-specific breakdown
        if not table_name:
            print(f"\n📋 BY TABLE:")
            table_stats = {}
            for qr in quality_reports:
                if qr.table_name not in table_stats:
                    table_stats[qr.table_name] = {
                        'reports': 0, 'records': 0, 'errors': 0, 'quality_sum': 0.0
                    }
                table_stats[qr.table_name]['reports'] += 1
                table_stats[qr.table_name]['records'] += qr.total_records
                table_stats[qr.table_name]['errors'] += qr.records_with_errors
                table_stats[qr.table_name]['quality_sum'] += float(qr.overall_quality_score)
            
            for table, stats in table_stats.items():
                avg_quality = stats['quality_sum'] / stats['reports']
                error_rate = (stats['errors'] / max(stats['records'], 1)) * 100
                print(f"   {table}: {stats['records']:,} records, {avg_quality:.3f} quality, {error_rate:.2f}% errors")
        
        # Recent quality trends
        print(f"\n📈 RECENT TRENDS (Last 7 days):")
        recent_reports = quality_reports.filter(report_date__gte=(datetime.now().date() - timedelta(days=7)))
        if recent_reports.exists():
            recent_avg_quality = sum(float(qr.overall_quality_score) for qr in recent_reports) / len(recent_reports)
            recent_total_records = sum(qr.total_records for qr in recent_reports)
            recent_total_errors = sum(qr.records_with_errors for qr in recent_reports)
            
            print(f"   Recent Quality Score: {recent_avg_quality:.3f}")
            print(f"   Recent Error Rate: {(recent_total_errors/max(recent_total_records,1))*100:.2f}%")
        else:
            print("   No recent reports available")
        
        return {
            "org_id": org_id,
            "org_name": org.name,
            "period_days": days,
            "table_name": table_name,
            "total_records": total_records,
            "total_errors": total_errors,
            "total_warnings": total_warnings,
            "avg_quality_scores": {
                "overall": avg_overall_score,
                "completeness": avg_completeness,
                "validity": avg_validity
            },
            "table_breakdown": table_stats if not table_name else None,
            "report_timestamp": datetime.now().isoformat()
        }
    
    def show_audit_trail(self, org_id: str, composite_key: Optional[str] = None, 
                        table_name: Optional[str] = None, limit: int = 50) -> Dict:
        """Show detailed audit trail and version history"""
        print("=" * 80)
        print("📜 AUDIT TRAIL & VERSION HISTORY")
        print("=" * 80)
        
        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            print(f"❌ Organization {org_id} not found")
            return {}
        
        print(f"🏢 Organization: {org.name}")
        if composite_key:
            print(f"🔑 Composite Key: {composite_key}")
        if table_name:
            print(f"📊 Table: {table_name}")
        print("-" * 80)
        
        # Build filter
        version_filter = {'org': org}
        if composite_key:
            version_filter['composite_key'] = composite_key
        if table_name:
            version_filter['table_name'] = table_name
        
        # Get version history
        version_history = DataVersionHistory.objects.filter(**version_filter).order_by('-change_timestamp')[:limit]
        
        if not version_history.exists():
            print("⚠️  No audit trail found for the specified criteria")
            return {}
        
        print(f"📋 Found {version_history.count()} audit trail entries")
        print()
        
        # Display entries
        for entry in version_history:
            print(f"🕒 {entry.change_timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print(f"   Table: {entry.table_name}")
            print(f"   Composite Key: {entry.composite_key}")
            print(f"   Change Type: {entry.change_type}")
            print(f"   Version: {entry.version}")
            if entry.previous_version:
                print(f"   Previous Version: {entry.previous_version}")
            if entry.changed_by:
                print(f"   Changed By: {entry.changed_by.username}")
            if entry.changed_fields:
                print(f"   Changed Fields: {', '.join(entry.changed_fields)}")
            print(f"   Data Hash: {entry.data_hash[:16]}...")
            if entry.quality_score:
                print(f"   Quality Score: {entry.quality_score}")
            if entry.source_file:
                print(f"   Source File: {entry.source_file}")
            print()
        
        # Summary statistics
        change_type_stats = {}
        user_stats = {}
        for entry in version_history:
            change_type_stats[entry.change_type] = change_type_stats.get(entry.change_type, 0) + 1
            if entry.changed_by:
                user_stats[entry.changed_by.username] = user_stats.get(entry.changed_by.username, 0) + 1
        
        print("📊 SUMMARY STATISTICS:")
        print("   Change Types:")
        for change_type, count in change_type_stats.items():
            print(f"     {change_type}: {count}")
        
        if user_stats:
            print("   Top Users:")
            sorted_users = sorted(user_stats.items(), key=lambda x: x[1], reverse=True)[:5]
            for username, count in sorted_users:
                print(f"     {username}: {count} changes")
        
        return {
            "org_id": org_id,
            "org_name": org.name,
            "total_entries": version_history.count(),
            "change_type_stats": change_type_stats,
            "user_stats": user_stats,
            "report_timestamp": datetime.now().isoformat()
        }
    
    def show_metrics(self, org_id: Optional[str] = None, days: int = 30) -> Dict:
        """Show performance and usage metrics"""
        print("=" * 80)
        print("📈 PERFORMANCE & USAGE METRICS")
        print("=" * 80)
        
        cutoff_date = datetime.now().date() - timedelta(days=days)
        
        if org_id:
            try:
                orgs = [Organization.objects.get(id=org_id)]
            except Organization.DoesNotExist:
                print(f"❌ Organization {org_id} not found")
                return {}
        else:
            orgs = Organization.objects.all()
        
        all_metrics = []
        
        for org in orgs:
            print(f"\n🏢 Organization: {org.name}")
            print("-" * 60)
            
            # Get recent metrics
            recent_metrics = OrganizationDataMetrics.objects.filter(
                org=org,
                metrics_date__gte=cutoff_date
            ).order_by('-metrics_date')
            
            if recent_metrics.exists():
                latest_metrics = recent_metrics.first()
                
                print(f"📊 Storage Metrics:")
                print(f"   Total Storage: {latest_metrics.total_storage_bytes / (1024**3):.2f} GB")
                print(f"   MongoDB: {latest_metrics.mongodb_storage_bytes / (1024**3):.2f} GB")
                print(f"   PostgreSQL: {latest_metrics.postgresql_storage_bytes / (1024**3):.2f} GB")
                
                print(f"\n📋 Record Counts:")
                print(f"   Total Records: {latest_metrics.total_records:,}")
                print(f"   Active Records: {latest_metrics.active_records:,}")
                print(f"   Tables: {latest_metrics.total_tables}")
                
                print(f"\n⚡ Performance:")
                if latest_metrics.average_ingestion_time_seconds:
                    print(f"   Avg Ingestion Time: {latest_metrics.average_ingestion_time_seconds:.2f}s")
                if latest_metrics.average_query_time_ms:
                    print(f"   Avg Query Time: {latest_metrics.average_query_time_ms:.2f}ms")
                
                print(f"\n📈 Processing:")
                print(f"   Jobs (period): {latest_metrics.ingestion_jobs_count}")
                print(f"   Success Rate: {latest_metrics.success_rate:.1f}%")
                print(f"   Quality Score: {latest_metrics.average_quality_score:.3f}")
                
                all_metrics.append({
                    "org_id": org.id,
                    "org_name": org.name,
                    "metrics": latest_metrics
                })
            else:
                print("⚠️  No metrics available for this period")
        
        return {
            "period_days": days,
            "organizations": len(orgs),
            "metrics": all_metrics,
            "report_timestamp": datetime.now().isoformat()
        }
    
    def show_alerts(self, org_id: Optional[str] = None, severity: Optional[str] = None) -> Dict:
        """Show active alerts and issues"""
        print("=" * 80)
        print("🚨 DATA ALERTS & ISSUES")
        print("=" * 80)
        
        # Build filter
        alert_filter = {'status__in': ['open', 'acknowledged']}
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
                alert_filter['org'] = org
                print(f"🏢 Organization: {org.name}")
            except Organization.DoesNotExist:
                print(f"❌ Organization {org_id} not found")
                return {}
        
        if severity:
            alert_filter['severity'] = severity
            print(f"🔍 Severity: {severity}")
        
        print("-" * 80)
        
        alerts = DataAlert.objects.filter(**alert_filter).order_by('-created_at')
        
        if not alerts.exists():
            print("✅ No active alerts found!")
            return {"alerts": [], "summary": {}}
        
        # Group by severity
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        type_counts = {}
        
        for alert in alerts:
            severity_counts[alert.severity] += 1
            type_counts[alert.alert_type] = type_counts.get(alert.alert_type, 0) + 1
        
        print(f"📊 SUMMARY: {alerts.count()} active alerts")
        print("   By Severity:")
        for sev, count in severity_counts.items():
            if count > 0:
                print(f"     {sev.title()}: {count}")
        
        print("   By Type:")
        for alert_type, count in type_counts.items():
            print(f"     {alert_type.title()}: {count}")
        
        print("\n🚨 ALERT DETAILS:")
        for alert in alerts[:20]:  # Show top 20
            print(f"\n   [{alert.severity.upper()}] {alert.title}")
            print(f"      Organization: {alert.org.name}")
            print(f"      Type: {alert.alert_type}")
            print(f"      Created: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
            if alert.table_name:
                print(f"      Table: {alert.table_name}")
            if alert.assigned_to:
                print(f"      Assigned to: {alert.assigned_to.username}")
            print(f"      Description: {alert.description[:100]}...")
        
        return {
            "total_alerts": alerts.count(),
            "severity_counts": severity_counts,
            "type_counts": type_counts,
            "alerts": [
                {
                    "id": alert.id,
                    "org_name": alert.org.name,
                    "severity": alert.severity,
                    "title": alert.title,
                    "alert_type": alert.alert_type,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in alerts
            ],
            "report_timestamp": datetime.now().isoformat()
        }

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="Enhanced Data Pipeline Management Tool")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show pipeline status')
    status_parser.add_argument('--org-id', type=str, help='Organization ID')
    status_parser.add_argument('--days', type=int, default=7, help='Number of days to analyze')
    
    # Quality command
    quality_parser = subparsers.add_parser('quality', help='Generate quality report')
    quality_parser.add_argument('--org-id', type=str, required=True, help='Organization ID')
    quality_parser.add_argument('--table', type=str, help='Specific table name')
    quality_parser.add_argument('--days', type=int, default=30, help='Number of days to analyze')
    
    # Audit command
    audit_parser = subparsers.add_parser('audit', help='Show audit trail')
    audit_parser.add_argument('--org-id', type=str, required=True, help='Organization ID')
    audit_parser.add_argument('--composite-key', type=str, help='Specific composite key')
    audit_parser.add_argument('--table', type=str, help='Specific table name')
    audit_parser.add_argument('--limit', type=int, default=50, help='Number of entries to show')
    
    # Metrics command
    metrics_parser = subparsers.add_parser('metrics', help='Show performance metrics')
    metrics_parser.add_argument('--org-id', type=str, help='Organization ID')
    metrics_parser.add_argument('--days', type=int, default=30, help='Number of days to analyze')
    
    # Alerts command
    alerts_parser = subparsers.add_parser('alerts', help='Show active alerts')
    alerts_parser.add_argument('--org-id', type=str, help='Organization ID')
    alerts_parser.add_argument('--severity', type=str, choices=['low', 'medium', 'high', 'critical'], help='Alert severity')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = DataPipelineManager()
    
    try:
        if args.command == 'status':
            result = manager.show_pipeline_status(args.org_id, args.days)
        elif args.command == 'quality':
            result = manager.generate_quality_report(args.org_id, args.table, args.days)
        elif args.command == 'audit':
            result = manager.show_audit_trail(args.org_id, args.composite_key, args.table, args.limit)
        elif args.command == 'metrics':
            result = manager.show_metrics(args.org_id, args.days)
        elif args.command == 'alerts':
            result = manager.show_alerts(args.org_id, args.severity)
        else:
            parser.print_help()
            return
        
        # Optionally save results to JSON file
        if '--save-json' in sys.argv:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"pipeline_report_{args.command}_{timestamp}.json"
            with open(filename, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            print(f"\n💾 Report saved to: {filename}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())