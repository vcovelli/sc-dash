from django.core.management.base import BaseCommand
from django.db import connections
from django.core.cache import cache
from django.conf import settings
from accounts.models import Organization, CustomUser
from config.db_utils import EnterpriseOrgDatabaseManager
from config.enterprise_security import EnterpriseSecurityManager
import time
import json
from datetime import datetime

class Command(BaseCommand):
    help = 'Comprehensive health check for enterprise multi-tenant system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=int,
            help='Check specific organization (if not provided, checks all)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Verbose output with detailed metrics',
        )
        parser.add_argument(
            '--json',
            action='store_true',
            help='Output results in JSON format',
        )
        parser.add_argument(
            '--fix-issues',
            action='store_true',
            help='Attempt to fix detected issues automatically',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'checks': {},
            'organizations': {},
            'performance_metrics': {},
            'issues_found': [],
            'fixes_applied': []
        }

        self.verbose = options.get('verbose', False)
        self.fix_issues = options.get('fix_issues', False)
        self.output_json = options.get('json', False)
        
        if not self.output_json:
            self.stdout.write('🏥 Starting Enterprise Health Check...\n')

        # 1. Check Platform Infrastructure
        self.check_platform_infrastructure(results)
        
        # 2. Check Database Connectivity
        self.check_database_connectivity(results)
        
        # 3. Check Organization-Specific Health
        org_id = options.get('org_id')
        if org_id:
            orgs = [Organization.objects.get(id=org_id)]
        else:
            orgs = Organization.objects.all()
        
        for org in orgs:
            self.check_organization_health(org, results)
        
        # 4. Check Security & Performance
        self.check_security_metrics(results)
        self.check_performance_metrics(results)
        
        # 5. Generate Summary
        total_time = time.time() - start_time
        results['execution_time_seconds'] = round(total_time, 2)
        
        if len(results['issues_found']) > 0:
            results['overall_status'] = 'issues_detected'
        
        self.output_results(results)

    def check_platform_infrastructure(self, results):
        """Check core platform infrastructure"""
        checks = {}
        
        # Check Redis connectivity
        try:
            cache.set('health_check', 'test', timeout=30)
            cache.get('health_check')
            checks['redis'] = {'status': 'healthy', 'message': 'Redis connection successful'}
        except Exception as e:
            checks['redis'] = {'status': 'error', 'message': f'Redis error: {str(e)}'}
            results['issues_found'].append('Redis connectivity failed')
        
        # Check default database
        try:
            with connections['default'].cursor() as cursor:
                cursor.execute("SELECT 1")
            checks['default_database'] = {'status': 'healthy', 'message': 'Default database connection successful'}
        except Exception as e:
            checks['default_database'] = {'status': 'error', 'message': f'Default DB error: {str(e)}'}
            results['issues_found'].append('Default database connectivity failed')
        
        # Check file system permissions
        try:
            import os
            test_file = '/tmp/health_check_test'
            with open(test_file, 'w') as f:
                f.write('test')
            os.remove(test_file)
            checks['filesystem'] = {'status': 'healthy', 'message': 'File system permissions OK'}
        except Exception as e:
            checks['filesystem'] = {'status': 'error', 'message': f'File system error: {str(e)}'}
            results['issues_found'].append('File system permission issues')
        
        results['checks']['platform_infrastructure'] = checks
        
        if not self.output_json:
            self.stdout.write('✅ Platform Infrastructure Check Complete')

    def check_database_connectivity(self, results):
        """Check database connectivity and configuration"""
        checks = {}
        db_manager = EnterpriseOrgDatabaseManager()
        
        # Check all configured databases
        for alias, config in connections.databases.items():
            try:
                with connections[alias].cursor() as cursor:
                    cursor.execute("SELECT version()")
                    version = cursor.fetchone()[0]
                checks[alias] = {
                    'status': 'healthy',
                    'message': f'Connected successfully',
                    'version': version if self.verbose else 'Available'
                }
            except Exception as e:
                checks[alias] = {'status': 'error', 'message': f'Connection failed: {str(e)}'}
                results['issues_found'].append(f'Database {alias} connectivity failed')
                
                if self.fix_issues and alias.startswith('orgdata_'):
                    org_id = alias.replace('orgdata_', '')
                    try:
                        # Attempt to recreate database
                        from config.db_utils import ensure_org_database_enterprise
                        ensure_org_database_enterprise(int(org_id))
                        results['fixes_applied'].append(f'Recreated database {alias}')
                    except Exception as fix_error:
                        results['issues_found'].append(f'Failed to fix database {alias}: {str(fix_error)}')
        
        results['checks']['database_connectivity'] = checks
        
        if not self.output_json:
            self.stdout.write('✅ Database Connectivity Check Complete')

    def check_organization_health(self, org, results):
        """Check health for specific organization"""
        org_checks = {}
        db_manager = EnterpriseOrgDatabaseManager()
        
        # Check organization database
        db_health = db_manager.monitor_database_health(org.id)
        org_checks['database_health'] = db_health
        
        # Check schema validation
        schema_validation = db_manager.validate_database_schema(org.id)
        org_checks['schema_validation'] = schema_validation
        
        if not schema_validation.get('valid', False):
            results['issues_found'].append(f'Schema validation failed for org {org.id}: {schema_validation.get("message")}')
        
        # Check data isolation
        security_manager = EnterpriseSecurityManager()
        isolation_check = security_manager.validate_database_isolation(org.id)
        org_checks['data_isolation'] = isolation_check
        
        if not isolation_check.get('isolated', False):
            results['issues_found'].append(f'Data isolation issue for org {org.id}: {isolation_check.get("reason")}')
        
        # Check user counts and permissions
        user_count = CustomUser.objects.filter(org=org).count()
        org_checks['user_metrics'] = {
            'total_users': user_count,
            'active_users': CustomUser.objects.filter(org=org, is_active=True).count(),
        }
        
        # Performance metrics
        if self.verbose:
            perf_metrics = cache.get(f"db_performance:{org.id}:read_org_db", {})
            org_checks['performance'] = {
                'avg_query_time': perf_metrics.get('avg_time', 0),
                'total_queries': perf_metrics.get('count', 0)
            }
        
        results['organizations'][f'org_{org.id}'] = {
            'name': org.name,
            'checks': org_checks,
            'overall_status': 'healthy' if len([c for c in org_checks.values() if c.get('status') == 'error' or not c.get('healthy', True)]) == 0 else 'issues'
        }
        
        if not self.output_json:
            status_icon = '✅' if results['organizations'][f'org_{org.id}']['overall_status'] == 'healthy' else '⚠️'
            self.stdout.write(f'{status_icon} Organization {org.name} (ID: {org.id}) Health Check Complete')

    def check_security_metrics(self, results):
        """Check security-related metrics"""
        checks = {}
        
        # Check for suspicious activity patterns
        security_manager = EnterpriseSecurityManager()
        
        # Check rate limiting status
        rate_limit_violations = 0
        for org in Organization.objects.all():
            for operation in ['db_operations', 'api_calls', 'file_uploads']:
                cache_key = f"rate_limit:{org.id}:{operation}:{datetime.now().hour}"
                current_count = cache.get(cache_key, 0)
                limit = security_manager.rate_limits.get(operation, 1000)
                
                if current_count > limit * 0.8:  # Alert at 80% of limit
                    rate_limit_violations += 1
        
        checks['rate_limiting'] = {
            'status': 'healthy' if rate_limit_violations == 0 else 'warning',
            'violations': rate_limit_violations,
            'message': f'{rate_limit_violations} organizations approaching rate limits'
        }
        
        # Check authentication patterns
        failed_logins = cache.get('failed_login_attempts', 0)
        checks['authentication'] = {
            'status': 'healthy' if failed_logins < 10 else 'warning',
            'failed_attempts_last_hour': failed_logins,
            'message': 'Authentication patterns normal' if failed_logins < 10 else 'Elevated failed login attempts'
        }
        
        results['checks']['security_metrics'] = checks
        
        if not self.output_json:
            self.stdout.write('✅ Security Metrics Check Complete')

    def check_performance_metrics(self, results):
        """Check system performance metrics"""
        metrics = {}
        
        # Database performance across all orgs
        total_query_time = 0
        total_queries = 0
        slow_queries = 0
        
        for org in Organization.objects.all():
            for operation in ['read_org_db', 'write_org_db', 'config_creation']:
                cache_key = f"db_performance:{org.id}:{operation}"
                perf_data = cache.get(cache_key, {})
                
                if perf_data:
                    total_query_time += perf_data.get('total_time', 0)
                    total_queries += perf_data.get('count', 0)
                    
                    if perf_data.get('avg_time', 0) > 1.0:
                        slow_queries += 1
        
        metrics['database_performance'] = {
            'avg_query_time': round(total_query_time / max(total_queries, 1), 3),
            'total_queries': total_queries,
            'slow_queries': slow_queries,
            'status': 'healthy' if slow_queries < 5 else 'warning'
        }
        
        # Memory and connection usage
        active_connections = 0
        for alias in connections.databases.keys():
            try:
                if alias.startswith('orgdata_'):
                    with connections[alias].cursor() as cursor:
                        cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()")
                        active_connections += cursor.fetchone()[0]
            except:
                pass
        
        metrics['resource_usage'] = {
            'active_db_connections': active_connections,
            'status': 'healthy' if active_connections < 100 else 'warning'
        }
        
        results['performance_metrics'] = metrics
        
        if not self.output_json:
            self.stdout.write('✅ Performance Metrics Check Complete')

    def output_results(self, results):
        """Output results in requested format"""
        if self.output_json:
            self.stdout.write(json.dumps(results, indent=2))
        else:
            # Human-readable summary
            self.stdout.write('\n' + '='*60)
            self.stdout.write('🏥 ENTERPRISE HEALTH CHECK SUMMARY')
            self.stdout.write('='*60)
            
            # Overall status
            status_icon = '✅' if results['overall_status'] == 'healthy' else '⚠️'
            self.stdout.write(f'\nOverall Status: {status_icon} {results["overall_status"].upper()}')
            self.stdout.write(f'Execution Time: {results["execution_time_seconds"]}s')
            self.stdout.write(f'Organizations Checked: {len(results["organizations"])}')
            
            # Issues summary
            if results['issues_found']:
                self.stdout.write(f'\n🚨 ISSUES FOUND ({len(results["issues_found"])}):')
                for issue in results['issues_found']:
                    self.stdout.write(f'  • {issue}')
            
            # Fixes applied
            if results['fixes_applied']:
                self.stdout.write(f'\n🔧 FIXES APPLIED ({len(results["fixes_applied"])}):')
                for fix in results['fixes_applied']:
                    self.stdout.write(f'  • {fix}')
            
            # Performance summary
            if 'database_performance' in results['performance_metrics']:
                perf = results['performance_metrics']['database_performance']
                self.stdout.write(f'\n📊 PERFORMANCE SUMMARY:')
                self.stdout.write(f'  • Average Query Time: {perf["avg_query_time"]}s')
                self.stdout.write(f'  • Total Queries: {perf["total_queries"]}')
                self.stdout.write(f'  • Slow Queries: {perf["slow_queries"]}')
            
            self.stdout.write('\n' + '='*60)
            
            if results['overall_status'] == 'healthy':
                self.stdout.write('🎉 All systems are running smoothly!')
            else:
                self.stdout.write('⚠️  Issues detected. Review the details above.')
                if not self.fix_issues:
                    self.stdout.write('💡 Run with --fix-issues to attempt automatic repairs.')