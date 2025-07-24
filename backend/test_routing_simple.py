#!/usr/bin/env python3
"""
Simple Routing Test with Comprehensive Logging
This script demonstrates the detailed logging added to the routing system.
"""
import os
import sys
import django
from pathlib import Path

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')

# Setup Django
django.setup()

from config.routers import EnterpriseOrgDatabaseRouter, set_org_context, get_org_context, clear_org_context
from api.models import Supplier
from accounts.models import Organization

def main():
    """Main test function that demonstrates routing with logging"""
    print("🔧 Simple Routing Test - Demonstrating Comprehensive Logging")
    print("=" * 80)
    
    # Initialize router
    print("\n1. Initializing Router...")
    router = EnterpriseOrgDatabaseRouter()
    print(f"✅ Router initialized with {len(router.org_models)} org models")
    
    # Test context management
    print("\n2. Testing Context Management...")
    
    print("   Clearing any existing context...")
    clear_org_context()
    
    print("   Setting test organization context...")
    test_org_id = 123
    set_org_context(test_org_id)
    
    context = get_org_context()
    print(f"   Retrieved context: {context}")
    
    # Test routing decisions
    print("\n3. Testing Routing Decisions...")
    
    print("   Testing Organization model routing (should go to 'default')...")
    org_db = router.db_for_read(Organization)
    print(f"   Organization model routed to: {org_db}")
    
    print("   Testing Supplier model routing (should go to org database)...")
    supplier_db = router.db_for_read(Supplier)
    print(f"   Supplier model routed to: {supplier_db}")
    
    # Test without context
    print("\n4. Testing Without Context...")
    print("   Clearing context...")
    clear_org_context()
    
    print("   Testing Supplier model routing without context...")
    supplier_db_no_context = router.db_for_read(Supplier)
    print(f"   Supplier model (no context) routed to: {supplier_db_no_context}")
    
    # Test alias generation
    print("\n5. Testing Database Alias Generation...")
    test_cases = [
        (123, "orgdata_123"),
        ("456", "orgdata_456"), 
        ("orgdata_789", "orgdata_789"),
        (None, None)
    ]
    
    for org_id, expected in test_cases:
        alias = router._get_org_db_alias(org_id)
        status = "✅" if alias == expected else "❌"
        print(f"   {status} Org {org_id} -> {alias} (expected: {expected})")
    
    # Test migration control
    print("\n6. Testing Migration Control...")
    migration_tests = [
        ("default", "accounts", "organization", True),
        ("default", "api", "supplier", False),
        ("orgdata_123", "api", "supplier", True),
        ("orgdata_123", "admin", "logentry", False),
    ]
    
    for db, app, model, expected in migration_tests:
        result = router.allow_migrate(db, app, model)
        status = "✅" if result == expected else "❌"
        print(f"   {status} {app}.{model} to {db}: {result} (expected: {expected})")
    
    print("\n7. Summary...")
    print("✅ Simple routing test completed!")
    print("📋 Check the following log files for detailed output:")
    print("   • logs/database_routing.log - Router-specific logs")
    print("   • Console output above - Real-time logging")
    
    print("\n💡 Key Logging Features Demonstrated:")
    print("   🔄 Context management with thread IDs")
    print("   🎯 Routing decisions with performance tracking")
    print("   🔧 Database alias generation")
    print("   🔍 Model identification")
    print("   🚫 Access validation")
    print("   📊 Performance metrics")
    print("   🧹 Context cleanup")
    
    print(f"\n{'-'*80}")
    print("To see more detailed logs, check the log files or run this in DEBUG mode.")
    print("The routing system now provides comprehensive logging at every step!")

if __name__ == "__main__":
    main()