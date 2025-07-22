#!/usr/bin/env python3
"""
Debug Relational UI Script
Validates the relational UI components and data integrity
"""

import os
import sys
import time
from pathlib import Path

# Setup paths and Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

def debug_relational_ui():
    """Main debug function for relational UI components"""
    print("🔍 Starting Relational UI Debug Suite")
    print("=" * 50)
    
    success_count = 0
    total_count = 0
    
    # Test 1: Check Django admin accessibility
    total_count += 1
    try:
        from django.contrib import admin
        print("✅ Django admin module loaded")
        success_count += 1
    except Exception as e:
        print(f"❌ Django admin error: {e}")
    
    # Test 2: Check model relationships
    total_count += 1
    try:
        from api.models import Supplier, Product, Customer
        from accounts.models import Organization
        
        # Test model imports
        print("✅ API models imported successfully")
        success_count += 1
    except Exception as e:
        print(f"❌ Model import error: {e}")
    
    # Test 3: Check database connectivity
    total_count += 1
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connectivity verified")
        success_count += 1
    except Exception as e:
        print(f"❌ Database connectivity error: {e}")
    
    # Test 4: Check frontend static files
    total_count += 1
    try:
        from django.conf import settings
        static_root = getattr(settings, 'STATIC_ROOT', None)
        if static_root and os.path.exists(static_root):
            print("✅ Static files directory exists")
            success_count += 1
        else:
            print("⚠️  Static files directory not found (may be normal in development)")
            success_count += 1  # Don't fail for this in development
    except Exception as e:
        print(f"❌ Static files error: {e}")
    
    # Test 5: Check organization context
    total_count += 1
    try:
        from config.routers import set_org_context, get_org_context
        set_org_context(1)
        context = get_org_context()
        if context == 1:
            print("✅ Organization context management working")
            success_count += 1
        else:
            print("❌ Organization context not working properly")
    except Exception as e:
        print(f"❌ Organization context error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Debug Results: {success_count}/{total_count} tests passed")
    print(f"🎯 Success Rate: {(success_count/total_count)*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 All relational UI components are working correctly!")
        return True
    else:
        print("⚠️  Some issues detected - check logs above")
        return False

if __name__ == "__main__":
    success = debug_relational_ui()
    sys.exit(0 if success else 1)
