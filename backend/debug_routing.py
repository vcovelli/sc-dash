#!/usr/bin/env python3
"""
Comprehensive Database Routing Debug Script
This script tests all aspects of the routing system with detailed logging output.
"""
import os
import sys
import django
import time
import threading
from pathlib import Path

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

import logging
from django.conf import settings
from django.db import connections
from config.routers import (
    EnterpriseOrgDatabaseRouter, 
    set_org_context, 
    get_org_context, 
    clear_org_context
)
from config.db_utils import ensure_org_database_enterprise
from accounts.models import Organization, CustomUser
from api.models import Supplier

# Configure detailed logging for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/routing_debug.log', mode='w')
    ]
)

logger = logging.getLogger(__name__)

class RoutingDebugger:
    """Comprehensive routing system debugger"""
    
    def __init__(self):
        self.router = EnterpriseOrgDatabaseRouter()
        self.test_results = []
        self.errors = []
        
    def print_separator(self, title):
        """Print a formatted separator for test sections"""
        line = "=" * 80
        print(f"\n{line}")
        print(f" {title} ".center(80, "="))
        print(f"{line}\n")
        logger.info(f"🧪 TEST SECTION: {title}")

    def print_subsection(self, title):
        """Print a formatted subsection"""
        line = "-" * 60
        print(f"\n{line}")
        print(f" {title} ")
        print(f"{line}")
        logger.info(f"🔧 TEST SUBSECTION: {title}")

    def log_test_result(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
        if not success:
            self.errors.append(f"{test_name}: {details}")
            
        logger.info(f"📊 TEST RESULT: {test_name} - {status} {details}")

    def test_environment_setup(self):
        """Test 1: Environment and configuration validation"""
        self.print_separator("ENVIRONMENT SETUP VALIDATION")
        
        # Check Django configuration
        print(f"Django DEBUG mode: {settings.DEBUG}")
        print(f"Database router: {settings.DATABASE_ROUTERS}")
        print(f"Available databases: {list(settings.DATABASES.keys())}")
        
        # Check logging configuration
        routing_logger = logging.getLogger('config.routers')
        print(f"Routing logger level: {routing_logger.level}")
        print(f"Routing logger handlers: {[h.__class__.__name__ for h in routing_logger.handlers]}")
        
        # Check database connection to default
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            self.log_test_result("Default database connection", result[0] == 1)
        except Exception as e:
            self.log_test_result("Default database connection", False, str(e))

    def test_context_management(self):
        """Test 2: Organization context management"""
        self.print_separator("ORGANIZATION CONTEXT MANAGEMENT")
        
        # Test setting context
        self.print_subsection("Context Setting")
        test_org_id = 999
        
        clear_org_context()
        initial_context = get_org_context()
        self.log_test_result("Initial context cleared", initial_context is None)
        
        set_org_context(test_org_id)
        retrieved_context = get_org_context()
        self.log_test_result("Context setting and retrieval", retrieved_context == test_org_id)
        
        # Test context clearing
        self.print_subsection("Context Clearing")
        clear_org_context()
        cleared_context = get_org_context()
        self.log_test_result("Context clearing", cleared_context is None)
        
        # Test thread isolation
        self.print_subsection("Thread Isolation")
        def test_thread_context(org_id, results):
            set_org_context(org_id)
            time.sleep(0.1)
            results[threading.current_thread().ident] = get_org_context()
        
        thread_results = {}
        threads = []
        for i in range(3):
            t = threading.Thread(target=test_thread_context, args=(i + 100, thread_results))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        unique_contexts = set(thread_results.values())
        self.log_test_result(
            "Thread context isolation", 
            len(unique_contexts) == 3,
            f"Contexts: {list(thread_results.values())}"
        )

    def test_router_initialization(self):
        """Test 3: Router initialization and model identification"""
        self.print_separator("ROUTER INITIALIZATION")
        
        # Test router creation
        router = EnterpriseOrgDatabaseRouter()
        self.log_test_result("Router initialization", router is not None)
        
        # Test model identification
        self.print_subsection("Model Identification")
        
        # Test Organization model (should go to default)
        org_model_id = router._get_model_identifier(Organization)
        self.log_test_result(
            "Organization model identification", 
            org_model_id == "accounts.organization",
            f"Got: {org_model_id}"
        )
        
        # Test Supplier model (should be in org_models)
        supplier_model_id = router._get_model_identifier(Supplier)
        is_org_model = supplier_model_id in router.org_models
        self.log_test_result(
            "Supplier model in org_models", 
            is_org_model,
            f"Model ID: {supplier_model_id}, In org_models: {is_org_model}"
        )

    def test_database_alias_generation(self):
        """Test 4: Database alias generation"""
        self.print_separator("DATABASE ALIAS GENERATION")
        
        test_cases = [
            (123, "orgdata_123"),
            ("456", "orgdata_456"),
            ("orgdata_789", "orgdata_789"),
            (None, None),
            ("", None)
        ]
        
        for org_id, expected in test_cases:
            alias = self.router._get_org_db_alias(org_id)
            self.log_test_result(
                f"Alias generation for {org_id}",
                alias == expected,
                f"Expected: {expected}, Got: {alias}"
            )

    def test_organization_setup(self):
        """Test 5: Organization creation and database setup"""
        self.print_separator("ORGANIZATION SETUP")
        
        # Create or get test organization
        test_org_name = "Debug Test Organization"
        test_org_slug = "debug-test-org"
        
        try:
            org, created = Organization.objects.get_or_create(
                slug=test_org_slug,
                defaults={'name': test_org_name}
            )
            action = "created" if created else "retrieved"
            self.log_test_result(f"Test organization {action}", True, f"Org ID: {org.id}")
            
            # Test database creation for this org
            self.print_subsection("Database Creation")
            try:
                ensure_org_database_enterprise(org.id)
                self.log_test_result("Database creation", True, f"Created/verified for org {org.id}")
                
                # Check if database was added to Django config
                db_alias = f"orgdata_{org.id}"
                db_configured = db_alias in connections.databases
                self.log_test_result(
                    "Database configuration", 
                    db_configured,
                    f"Alias: {db_alias}, Configured: {db_configured}"
                )
                
                # Test connection to the org database
                if db_configured:
                    try:
                        with connections[db_alias].cursor() as cursor:
                            cursor.execute("SELECT 1")
                            result = cursor.fetchone()
                        self.log_test_result("Org database connection", result[0] == 1)
                    except Exception as e:
                        self.log_test_result("Org database connection", False, str(e))
                
            except Exception as e:
                self.log_test_result("Database creation", False, str(e))
                
        except Exception as e:
            self.log_test_result("Test organization creation", False, str(e))

    def test_routing_decisions(self):
        """Test 6: Routing decision logic"""
        self.print_separator("ROUTING DECISIONS")
        
        # Test Organization model routing (should always go to default)
        self.print_subsection("Organization Model Routing")
        org_db = self.router.db_for_read(Organization)
        self.log_test_result(
            "Organization routes to default",
            org_db == "default",
            f"Routed to: {org_db}"
        )
        
        # Test Supplier model routing without context
        self.print_subsection("Supplier Model Routing (No Context)")
        clear_org_context()
        supplier_db_no_context = self.router.db_for_read(Supplier)
        self.log_test_result(
            "Supplier without context routes to default",
            supplier_db_no_context == "default",
            f"Routed to: {supplier_db_no_context}"
        )
        
        # Test Supplier model routing with context
        self.print_subsection("Supplier Model Routing (With Context)")
        # Get the test org we created earlier
        try:
            org = Organization.objects.get(slug="debug-test-org")
            set_org_context(org.id)
            
            supplier_db_with_context = self.router.db_for_read(Supplier)
            expected_alias = f"orgdata_{org.id}"
            
            self.log_test_result(
                "Supplier with context routes to org DB",
                supplier_db_with_context == expected_alias,
                f"Expected: {expected_alias}, Got: {supplier_db_with_context}"
            )
            
        except Organization.DoesNotExist:
            self.log_test_result("Supplier with context test", False, "Test organization not found")
        except Exception as e:
            self.log_test_result("Supplier with context test", False, str(e))

    def test_data_operations(self):
        """Test 7: Actual data operations with routing"""
        self.print_separator("DATA OPERATIONS")
        
        try:
            org = Organization.objects.get(slug="debug-test-org")
            set_org_context(org.id)
            
            # Test creating a supplier
            self.print_subsection("Data Creation")
            supplier_name = f"Debug Supplier {int(time.time())}"
            supplier_email = f"debug{int(time.time())}@test.com"
            
            try:
                supplier = Supplier.objects.create(
                    name=supplier_name,
                    email=supplier_email
                )
                supplier.org = org
                supplier.save()
                
                self.log_test_result(
                    "Supplier creation",
                    supplier.id is not None,
                    f"Created supplier ID: {supplier.id}"
                )
                
                # Test querying suppliers
                self.print_subsection("Data Querying")
                suppliers = Supplier.objects.all()
                supplier_count = suppliers.count()
                
                self.log_test_result(
                    "Supplier querying",
                    supplier_count > 0,
                    f"Found {supplier_count} suppliers"
                )
                
                # Test data isolation by switching context
                self.print_subsection("Data Isolation")
                clear_org_context()
                set_org_context(999999)  # Non-existent org
                
                isolated_suppliers = Supplier.objects.all()
                isolated_count = isolated_suppliers.count()
                
                self.log_test_result(
                    "Data isolation",
                    isolated_count == 0,
                    f"Found {isolated_count} suppliers in different org context"
                )
                
            except Exception as e:
                self.log_test_result("Data operations", False, str(e))
                
        except Organization.DoesNotExist:
            self.log_test_result("Data operations test", False, "Test organization not found")
        except Exception as e:
            self.log_test_result("Data operations test", False, str(e))

    def test_migration_control(self):
        """Test 8: Migration control logic"""
        self.print_separator("MIGRATION CONTROL")
        
        test_cases = [
            # (db, app_label, model_name, expected_result)
            ("default", "auth", "user", True),
            ("default", "accounts", "organization", True),
            ("default", "api", "supplier", False),
            ("orgdata_123", "api", "supplier", True),
            ("orgdata_123", "admin", "logentry", False),
            ("unknown_db", "api", "supplier", None),
        ]
        
        for db, app_label, model_name, expected in test_cases:
            result = self.router.allow_migrate(db, app_label, model_name)
            self.log_test_result(
                f"Migration: {app_label}.{model_name} to {db}",
                result == expected,
                f"Expected: {expected}, Got: {result}"
            )

    def test_performance_tracking(self):
        """Test 9: Performance tracking"""
        self.print_separator("PERFORMANCE TRACKING")
        
        if self.router.enable_performance_monitoring:
            # Trigger some operations to generate metrics
            set_org_context(123)
            for i in range(5):
                self.router.db_for_read(Supplier)
            
            # Check if metrics were recorded (this would require cache access)
            self.log_test_result("Performance monitoring enabled", True, "Metrics should be recorded")
        else:
            self.log_test_result("Performance monitoring", False, "Monitoring disabled")

    def print_summary(self):
        """Print test summary"""
        self.print_separator("TEST SUMMARY")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: ✅ {passed_tests}")
        print(f"Failed: ❌ {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.errors:
            print(f"\n🚨 FAILED TESTS:")
            for error in self.errors:
                print(f"  • {error}")
        
        # Print current Django database configuration
        print(f"\n📊 CURRENT DATABASE CONFIGURATION:")
        for db_name, db_config in settings.DATABASES.items():
            print(f"  • {db_name}: {db_config['NAME']} ({db_config.get('ENGINE', 'unknown')})")
        
        print(f"\n📋 LOG FILES:")
        print(f"  • Debug log: logs/routing_debug.log")
        print(f"  • Router log: logs/database_routing.log")

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Comprehensive Routing Debug Session")
        print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            self.test_environment_setup()
            self.test_context_management()
            self.test_router_initialization()
            self.test_database_alias_generation()
            self.test_organization_setup()
            self.test_routing_decisions()
            self.test_data_operations()
            self.test_migration_control()
            self.test_performance_tracking()
            
        except Exception as e:
            logger.error(f"💥 CRITICAL ERROR during testing: {e}")
            self.errors.append(f"Critical error: {e}")
        
        finally:
            # Clean up context
            clear_org_context()
            self.print_summary()

def main():
    """Main function"""
    debugger = RoutingDebugger()
    debugger.run_all_tests()
    
    # Return exit code based on test results
    return 0 if not debugger.errors else 1

if __name__ == "__main__":
    sys.exit(main())