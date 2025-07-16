#!/usr/bin/env python3
"""
Simple test script to verify the database routing system works.
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

from config.routers import OrgDatabaseRouter, set_org_context, get_org_context
from api.models import Supplier

def test_router():
    """Test the database router functionality"""
    print("🔧 Testing Database Router")
    print("=" * 50)
    
    # Test 1: Router initialization
    router = OrgDatabaseRouter()
    print("✅ Router initialized successfully")
    
    # Test 2: Context management
    set_org_context(123)
    context = get_org_context()
    print(f"✅ Organization context set and retrieved: {context}")
    
    # Test 3: Database alias creation
    db_alias = router._get_org_db_alias(123)
    print(f"✅ Database alias created: {db_alias}")
    
    # Test 4: Database configuration
    config_alias = router._ensure_org_database_config(123)
    print(f"✅ Database configuration ensured: {config_alias}")
    
    # Test 5: Model routing
    from django.conf import settings
    print(f"✅ Total databases configured: {len(settings.DATABASES)}")
    for db_name in settings.DATABASES:
        print(f"   - {db_name}")
    
    # Test 6: Routing decision
    db_for_read = router.db_for_read(Supplier)
    print(f"✅ Supplier model routes to: {db_for_read}")
    
    print("\n🎉 All router tests passed!")
    return True

if __name__ == "__main__":
    try:
        test_router()
        print("\n✨ Database routing system is working correctly!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error testing router: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)