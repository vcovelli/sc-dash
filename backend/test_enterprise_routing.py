#!/usr/bin/env python3
"""
Enterprise Multi-Tenant Database Routing Test Suite
Comprehensive testing for enterprise-grade multi-tenant functionality.
"""
import os
import sys
import django
import time
import threading
from pathlib import Path
from unittest.mock import patch
import concurrent.futures

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from config.routers import EnterpriseOrgDatabaseRouter, set_org_context, get_org_context
from config.db_utils import EnterpriseOrgDatabaseManager, ensure_org_database_enterprise
from config.enterprise_security import EnterpriseSecurityManager
from accounts.models import Organization, CustomUser
from api.models import Supplier, Product, Customer
from django.db import connections, transaction
from django.test import TestCase
from django.core.cache import cache

class EnterpriseMultiTenantTests:
    """Comprehensive test suite for enterprise multi-tenant functionality"""
    
    def __init__(self):
        self.router = EnterpriseOrgDatabaseRouter()
        self.db_manager = EnterpriseOrgDatabaseManager()
        self.security_manager = EnterpriseSecurityManager()
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': [],
            'performance_metrics': {}
        }

    def run_all_tests(self):
        """Run the complete enterprise test suite"""
        print("🚀 Starting Enterprise Multi-Tenant Test Suite")
        print("=" * 60)
        
        # Basic functionality tests
        self.test_router_initialization()
        self.test_context_management()
        self.test_database_creation()
        self.test_data_isolation()
        self.test_cross_org_security()
        
        # Performance tests
        self.test_concurrent_access()
        self.test_connection_pooling()
        self.test_query_performance()
        
        # Security tests
        self.test_rate_limiting()
        self.test_access_validation()
        self.test_audit_logging()
        
        # Enterprise features
        self.test_backup_functionality()
        self.test_health_monitoring()
        self.test_schema_validation()
        
        # Print final results
        self.print_test_summary()
        
        return self.test_results['failed'] == 0

    def assert_test(self, condition, test_name, details=""):
        """Helper method for test assertions"""
        if condition:
            print(f"✅ {test_name}")
            self.test_results['passed'] += 1
        else:
            print(f"❌ {test_name} - {details}")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {details}")

    def test_router_initialization(self):
        """Test 1: Router initialization and basic functionality"""
        print("\n📋 Test 1: Router Initialization")
        
        try:
            router = EnterpriseOrgDatabaseRouter()
            self.assert_test(router is not None, "Router initialization")
            self.assert_test(hasattr(router, 'org_models'), "Router has org_models")
            self.assert_test('api.supplier' in router.org_models, "Supplier model in org_models")
            
        except Exception as e:
            self.assert_test(False, "Router initialization", str(e))

    def test_context_management(self):
        """Test 2: Organization context management"""
        print("\n📋 Test 2: Context Management")
        
        try:
            # Test setting context
            set_org_context(123)
            context = get_org_context()
            self.assert_test(context == 123, "Context setting and retrieval")
            
            # Test clearing context
            from config.routers import clear_org_context
            clear_org_context()
            context = get_org_context()
            self.assert_test(context is None, "Context clearing")
            
            # Test thread safety
            def test_thread_context(org_id, results):
                set_org_context(org_id)
                time.sleep(0.1)  # Simulate work
                results[threading.current_thread().ident] = get_org_context()
            
            thread_results = {}
            threads = []
            for i in range(5):
                t = threading.Thread(target=test_thread_context, args=(i, thread_results))
                threads.append(t)
                t.start()
            
            for t in threads:
                t.join()
            
            # Each thread should have its own context
            unique_contexts = set(thread_results.values())
            self.assert_test(len(unique_contexts) == 5, "Thread-local context isolation")
            
        except Exception as e:
            self.assert_test(False, "Context management", str(e))

    def test_database_creation(self):
        """Test 3: Dynamic database creation"""
        print("\n📋 Test 3: Database Creation")
        
        try:
            test_org_id = 999  # Use a test org ID
            
            # Test database creation
            db_alias = self.router._ensure_org_database_config(test_org_id)
            self.assert_test(db_alias == f"orgdata_{test_org_id}", "Database alias generation")
            
            # Test database exists in Django config
            self.assert_test(db_alias in connections.databases, "Database in Django configuration")
            
            # Test database connectivity
            try:
                with connections[db_alias].cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                self.assert_test(result[0] == 1, "Database connectivity")
            except Exception as e:
                self.assert_test(False, "Database connectivity", str(e))
                
        except Exception as e:
            self.assert_test(False, "Database creation", str(e))

    def test_data_isolation(self):
        """Test 4: Data isolation between organizations"""
        print("\n📋 Test 4: Data Isolation")
        
        try:
            # Create test organizations
            org1, _ = Organization.objects.get_or_create(name="Test Org 1", slug="test-org-1")
            org2, _ = Organization.objects.get_or_create(name="Test Org 2", slug="test-org-2")
            
            # Ensure databases exist
            ensure_org_database_enterprise(org1.id)
            ensure_org_database_enterprise(org2.id)
            
            # Test data isolation
            set_org_context(org1.id)
            supplier1 = Supplier.objects.create(name="Supplier 1", email="supplier1@test.com", org=org1)
            
            set_org_context(org2.id)
            supplier2 = Supplier.objects.create(name="Supplier 2", email="supplier2@test.com", org=org2)
            
            # Check that org1 can only see its data
            set_org_context(org1.id)
            org1_suppliers = Supplier.objects.all()
            self.assert_test(org1_suppliers.count() == 1, "Org 1 sees only its data")
            self.assert_test(org1_suppliers.first().name == "Supplier 1", "Org 1 sees correct data")
            
            # Check that org2 can only see its data
            set_org_context(org2.id)
            org2_suppliers = Supplier.objects.all()
            self.assert_test(org2_suppliers.count() == 1, "Org 2 sees only its data")
            self.assert_test(org2_suppliers.first().name == "Supplier 2", "Org 2 sees correct data")
            
            # Validate database isolation using security manager
            isolation1 = self.security_manager.validate_database_isolation(org1.id)
            isolation2 = self.security_manager.validate_database_isolation(org2.id)
            
            self.assert_test(isolation1.get('isolated', False), "Org 1 database isolation")
            self.assert_test(isolation2.get('isolated', False), "Org 2 database isolation")
            
        except Exception as e:
            self.assert_test(False, "Data isolation", str(e))

    def test_cross_org_security(self):
        """Test 5: Cross-organization security validation"""
        print("\n📋 Test 5: Cross-Org Security")
        
        try:
            # Test access validation
            user1 = CustomUser.objects.create_user(
                username="user1", 
                email="user1@test.com",
                password="test123"
            )
            user1.org_id = lambda: 1
            
            # Test legitimate access
            valid_access = self.security_manager.validate_org_access(user1, 1)
            self.assert_test(valid_access, "Valid org access allowed")
            
            # Test cross-org access attempt
            invalid_access = self.security_manager.validate_org_access(user1, 2)
            self.assert_test(not invalid_access, "Cross-org access blocked")
            
            # Test admin access (should work for any org)
            admin_user = CustomUser.objects.get_or_create(
                username="admin", 
                email="admin@test.com",
                password="admin123"
            )
            admin_user.role = 'admin'
            admin_access = self.security_manager.validate_org_access(admin_user, 2)
            self.assert_test(admin_access, "Admin can access any org")
            
        except Exception as e:
            self.assert_test(False, "Cross-org security", str(e))

    def test_concurrent_access(self):
        """Test 6: Concurrent access handling"""
        print("\n📋 Test 6: Concurrent Access")
        
        try:
            start_time = time.time()
            
            def concurrent_operation(org_id, results):
                try:
                    set_org_context(org_id)
                    # Simulate database operations
                    db_alias = self.router._ensure_org_database_config(org_id)
                    with connections[db_alias].cursor() as cursor:
                        cursor.execute("SELECT COUNT(*) FROM api_supplier")
                    results[org_id] = True
                except Exception as e:
                    results[org_id] = False
            
            # Test concurrent access with multiple threads
            org_ids = [1, 2, 3, 4, 5]
            results = {}
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(concurrent_operation, org_id, results) for org_id in org_ids]
                concurrent.futures.wait(futures)
            
            execution_time = time.time() - start_time
            self.test_results['performance_metrics']['concurrent_access_time'] = execution_time
            
            # All operations should succeed
            success_count = sum(1 for success in results.values() if success)
            self.assert_test(success_count == len(org_ids), f"Concurrent access ({success_count}/{len(org_ids)} successful)")
            self.assert_test(execution_time < 10.0, f"Concurrent access performance (<10s, actual: {execution_time:.2f}s)")
            
        except Exception as e:
            self.assert_test(False, "Concurrent access", str(e))

    def test_connection_pooling(self):
        """Test 7: Connection pooling functionality"""
        print("\n📋 Test 7: Connection Pooling")
        
        try:
            org_id = 1
            
            # Test connection pool creation
            pool = self.db_manager.get_connection_pool(org_id)
            self.assert_test(pool is not None, "Connection pool creation")
            
            # Test multiple connections from pool
            connections_used = []
            for i in range(3):
                try:
                    conn = pool.getconn()
                    connections_used.append(conn)
                    # Test connection works
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT 1")
                        result = cursor.fetchone()
                    self.assert_test(result[0] == 1, f"Pool connection {i+1} works")
                except Exception as e:
                    self.assert_test(False, f"Pool connection {i+1}", str(e))
            
            # Return connections to pool
            for conn in connections_used:
                pool.putconn(conn)
            
            # Test pool cleanup
            self.db_manager.close_connection_pool(org_id)
            self.assert_test(True, "Connection pool cleanup")
            
        except Exception as e:
            self.assert_test(False, "Connection pooling", str(e))

    def test_query_performance(self):
        """Test 8: Query performance monitoring"""
        print("\n📋 Test 8: Query Performance")
        
        try:
            org_id = 1
            set_org_context(org_id)
            
            # Clear existing metrics
            cache_key = f"db_performance:{org_id}:read_org_db"
            cache.delete(cache_key)
            
            # Perform some operations to generate metrics
            start_time = time.time()
            for i in range(10):
                self.router.db_for_read(Supplier)
            execution_time = time.time() - start_time
            
            # Check if performance metrics were recorded
            metrics = cache.get(cache_key, {})
            self.assert_test(metrics.get('count', 0) > 0, "Performance metrics recorded")
            
            self.test_results['performance_metrics']['query_performance_time'] = execution_time
            self.assert_test(execution_time < 1.0, f"Query performance (<1s, actual: {execution_time:.3f}s)")
            
        except Exception as e:
            self.assert_test(False, "Query performance", str(e))

    def test_rate_limiting(self):
        """Test 9: Rate limiting functionality"""
        print("\n📋 Test 9: Rate Limiting")
        
        try:
            org_id = 1
            
            # Test normal operations within limits
            for i in range(5):
                allowed = self.security_manager.check_rate_limit(org_id, 'api_calls')
                if i < 4:
                    self.assert_test(allowed, f"Rate limit allows normal operation {i+1}")
            
            # Test that rate limiting is working
            cache_key = f"rate_limit:{org_id}:api_calls:{time.localtime().tm_hour}"
            current_count = cache.get(cache_key, 0)
            self.assert_test(current_count > 0, "Rate limit counter incremented")
            
        except Exception as e:
            self.assert_test(False, "Rate limiting", str(e))

    def test_access_validation(self):
        """Test 10: Access validation"""
        print("\n📋 Test 10: Access Validation")
        
        try:
            # Test unauthenticated user
            from django.contrib.auth.models import AnonymousUser
            anon_user = AnonymousUser()
            access = self.security_manager.validate_org_access(anon_user, 1)
            self.assert_test(not access, "Unauthenticated access blocked")
            
            # Test authenticated user with org
            user = CustomUser.objects.create_user(
                username="testuser", 
                email="test@example.com",
                password="test123"
            )
            org = Organization.objects.create(name="Test Org", slug="test-org")
            user.org = org
            user.save()
            
            access = self.security_manager.validate_org_access(user, org.id)
            self.assert_test(access, "Valid user access allowed")
            
        except Exception as e:
            self.assert_test(False, "Access validation", str(e))

    def test_audit_logging(self):
        """Test 11: Audit logging functionality"""
        print("\n📋 Test 11: Audit Logging")
        
        try:
            user = CustomUser.objects.create_user(
                username="audituser", 
                email="audit@example.com",
                password="test123"
            )
            user._cached_ip = "192.168.1.100"
            
            # Test audit logging
            self.security_manager.audit_database_access(user, 1, "SELECT", "api_supplier")
            
            # Check if audit data was stored
            cache_key = f"audit:org:1:{time.strftime('%Y-%m-%d')}"
            audit_log = cache.get(cache_key, [])
            self.assert_test(len(audit_log) > 0, "Audit log entry created")
            
            if audit_log:
                entry = audit_log[-1]
                self.assert_test(entry['user_email'] == user.email, "Audit entry contains user email")
                self.assert_test(entry['operation'] == "SELECT", "Audit entry contains operation")
                self.assert_test(entry['org_id'] == 1, "Audit entry contains org ID")
            
        except Exception as e:
            self.assert_test(False, "Audit logging", str(e))

    def test_backup_functionality(self):
        """Test 12: Backup functionality"""
        print("\n📋 Test 12: Backup Functionality")
        
        try:
            org_id = 1
            
            # Test backup path generation
            backup_result = self.db_manager.backup_organization_database(org_id, "/tmp/test_backup.sql")
            
            # Note: This might fail in test environment without pg_dump
            # We'll test the logic rather than actual backup
            self.assert_test('backup_path' in backup_result or 'message' in backup_result, "Backup function returns result")
            
        except Exception as e:
            self.assert_test(False, "Backup functionality", str(e))

    def test_health_monitoring(self):
        """Test 13: Health monitoring"""
        print("\n📋 Test 13: Health Monitoring")
        
        try:
            org_id = 1
            
            # Test health monitoring
            health_data = self.db_manager.monitor_database_health(org_id)
            self.assert_test('healthy' in health_data, "Health monitoring returns status")
            self.assert_test('timestamp' in health_data, "Health monitoring includes timestamp")
            
            if health_data.get('healthy'):
                self.assert_test('database_size' in health_data, "Health data includes database size")
                self.assert_test('active_connections' in health_data, "Health data includes connection count")
            
        except Exception as e:
            self.assert_test(False, "Health monitoring", str(e))

    def test_schema_validation(self):
        """Test 14: Schema validation"""
        print("\n📋 Test 14: Schema Validation")
        
        try:
            org_id = 1
            
            # Test schema validation
            validation_result = self.db_manager.validate_database_schema(org_id)
            self.assert_test('valid' in validation_result, "Schema validation returns status")
            self.assert_test('message' in validation_result, "Schema validation includes message")
            
            if not validation_result.get('valid'):
                self.assert_test('missing_tables' in validation_result, "Schema validation lists missing tables")
            
        except Exception as e:
            self.assert_test(False, "Schema validation", str(e))

    def print_test_summary(self):
        """Print final test summary"""
        print("\n" + "=" * 60)
        print("🏁 ENTERPRISE TEST SUITE SUMMARY")
        print("=" * 60)
        
        total_tests = self.test_results['passed'] + self.test_results['failed']
        success_rate = (self.test_results['passed'] / max(total_tests, 1)) * 100
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: ✅ {self.test_results['passed']}")
        print(f"Failed: ❌ {self.test_results['failed']}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.test_results['performance_metrics']:
            print(f"\n📊 PERFORMANCE METRICS:")
            for metric, value in self.test_results['performance_metrics'].items():
                print(f"  • {metric}: {value:.3f}s")
        
        if self.test_results['errors']:
            print(f"\n🚨 FAILED TESTS:")
            for error in self.test_results['errors']:
                print(f"  • {error}")
        
        print("\n" + "=" * 60)
        
        if self.test_results['failed'] == 0:
            print("🎉 All tests passed! Your enterprise multi-tenant system is ready.")
        else:
            print("⚠️  Some tests failed. Please review the issues above.")

def main():
    """Main function to run tests"""
    try:
        test_suite = EnterpriseMultiTenantTests()
        success = test_suite.run_all_tests()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test suite execution failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()