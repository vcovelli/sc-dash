#!/usr/bin/env python3
"""
Debug script for relational-ui data loading issues.
Run this to check the health of your authentication and data pipeline.
"""

import os
import sys
import requests
import json
from urllib.parse import urljoin

def check_environment():
    """Check environment variables"""
    print("🔍 Checking Environment Variables...")
    
    required_vars = [
        'NEXT_PUBLIC_BACKEND_URL',
        'APP_DB_USER',
        'APP_DB_PASSWORD',
        'APP_DB_NAME'
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Don't print passwords in full
            if 'PASSWORD' in var:
                print(f"  ✅ {var}=***")
            else:
                print(f"  ✅ {var}={value}")
        else:
            print(f"  ❌ {var}=NOT SET")
            missing.append(var)
    
    if missing:
        print(f"  🚨 Missing variables: {', '.join(missing)}")
        return False
    return True

def check_backend_health():
    """Check if backend is accessible"""
    print("\n🏥 Checking Backend Health...")
    
    backend_url = os.getenv('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:8000')
    health_url = urljoin(backend_url, '/health/')
    
    try:
        response = requests.get(health_url, timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Backend is healthy at {backend_url}")
            return True
        else:
            print(f"  ❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Backend is not accessible: {e}")
        return False

def check_suppliers_endpoint():
    """Check suppliers API endpoint without authentication"""
    print("\n📊 Checking Suppliers API Endpoint...")
    
    backend_url = os.getenv('NEXT_PUBLIC_BACKEND_URL', 'http://localhost:8000')
    suppliers_url = urljoin(backend_url, '/api/suppliers/')
    
    try:
        response = requests.get(suppliers_url, timeout=5)
        print(f"  📡 Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("  ℹ️  Authentication required (expected)")
            return True
        elif response.status_code == 200:
            data = response.json()
            print(f"  ✅ Got {data.get('count', 0)} suppliers")
            return True
        else:
            print(f"  ❌ Unexpected status: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ API is not accessible: {e}")
        return False

def check_database_connection():
    """Check if we can connect to the database"""
    print("\n🗄️  Checking Database Connection...")
    
    try:
        # Try to import Django and check database
        sys.path.append('backend')
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        
        import django
        django.setup()
        
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("  ✅ Database connection successful")
                return True
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

def check_user_organization():
    """Check if there are users with organizations"""
    print("\n👥 Checking User Organizations...")
    
    try:
        from accounts.models import User, Organization
        
        org_count = Organization.objects.count()
        user_count = User.objects.count()
        users_with_org = User.objects.filter(org__isnull=False).count()
        
        print(f"  📊 Organizations: {org_count}")
        print(f"  👤 Users: {user_count}")
        print(f"  🏢 Users with organization: {users_with_org}")
        
        if org_count == 0:
            print("  ⚠️  No organizations found. Users need organizations for data access.")
            return False
        
        if users_with_org == 0:
            print("  ⚠️  No users assigned to organizations.")
            return False
            
        return True
        
    except Exception as e:
        print(f"  ❌ Could not check organizations: {e}")
        return False

def check_suppliers_data():
    """Check if there's supplier data in the database"""
    print("\n🏭 Checking Suppliers Data...")
    
    try:
        from api.models import Supplier
        
        supplier_count = Supplier.objects.count()
        print(f"  📊 Total suppliers: {supplier_count}")
        
        if supplier_count == 0:
            print("  ⚠️  No supplier data found. Run setup_relational_test_data command.")
            print("     python manage.py setup_relational_test_data")
            return False
        
        # Check suppliers by organization
        from django.db.models import Count
        org_suppliers = Supplier.objects.values('org__name').annotate(count=Count('id'))
        
        for item in org_suppliers:
            org_name = item['org__name'] or 'No Organization'
            count = item['count']
            print(f"  🏢 {org_name}: {count} suppliers")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Could not check suppliers: {e}")
        return False

def generate_recommendations():
    """Generate recommendations for fixing issues"""
    print("\n💡 Recommendations:")
    print("  1. Ensure .env file exists with proper configuration")
    print("  2. Start all services: docker-compose up -d")
    print("  3. Create test organization and user:")
    print("     cd backend && python manage.py shell")
    print("     from accounts.models import Organization, User")
    print("     org = Organization.objects.create(name='Test Org', slug='test-org')")
    print("     # Create or update user with organization")
    print("  4. Generate test data:")
    print("     python manage.py setup_relational_test_data")
    print("  5. Check Django admin at http://localhost:8000/admin")
    print("  6. Verify frontend env: NEXT_PUBLIC_BACKEND_URL=http://localhost:8000")

def main():
    """Main debug routine"""
    print("🔧 Relational UI Debug Tool")
    print("=" * 50)
    
    checks = [
        ("Environment", check_environment),
        ("Backend Health", check_backend_health),
        ("Suppliers API", check_suppliers_endpoint),
        ("Database", check_database_connection),
        ("Organizations", check_user_organization),
        ("Suppliers Data", check_suppliers_data),
    ]
    
    results = []
    for name, check_func in checks:
        result = check_func()
        results.append((name, result))
    
    print("\n📋 Summary:")
    print("-" * 30)
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} {name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All checks passed! Your relational UI should work.")
    else:
        print("\n🚨 Some checks failed. See recommendations below.")
        generate_recommendations()

if __name__ == "__main__":
    main()