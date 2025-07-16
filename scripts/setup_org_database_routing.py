#!/usr/bin/env python3
"""
Organization Database Routing Setup Script

This script sets up the database routing system for multi-tenant organizations
and ensures all existing organizations have their databases properly configured.

Usage:
    python setup_org_database_routing.py
"""

import os
import sys
import subprocess
from pathlib import Path

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from accounts.models import Organization


def run_command(command, description, check=True):
    """Run a Django management command"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True, cwd=BASE_DIR / "backend")
        if result.stdout:
            print(result.stdout)
        if result.stderr and result.returncode != 0:
            print(f"⚠️ Warning: {result.stderr}")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stdout:
            print(f"Output: {e.stdout}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False


def main():
    print("🚀 Setting up Organization Database Routing")
    print("=" * 60)

    # Change to backend directory for Django commands
    backend_dir = BASE_DIR / "backend"
    os.chdir(backend_dir)

    # Step 1: Run migrations on default database
    print("\n📋 Step 1: Setting up default database")
    success = run_command(
        "python manage.py migrate",
        "Running migrations on default database"
    )
    
    if not success:
        print("❌ Failed to migrate default database. Exiting.")
        return 1

    # Step 2: Get all organizations
    print("\n📋 Step 2: Finding existing organizations")
    try:
        organizations = Organization.objects.all()
        if not organizations.exists():
            print("⚠️ No organizations found. Creating a test organization...")
            success = run_command(
                "python manage.py setup_test_org",
                "Creating test organization"
            )
            if success:
                organizations = Organization.objects.all()
            else:
                print("❌ Failed to create test organization.")
                return 1
        
        print(f"✅ Found {organizations.count()} organization(s):")
        for org in organizations:
            print(f"   - {org.name} (ID: {org.id})")
            
    except Exception as e:
        print(f"❌ Error accessing organizations: {e}")
        return 1

    # Step 3: Set up organization databases
    print("\n📋 Step 3: Setting up organization databases")
    success = run_command(
        "python manage.py migrate_org_databases --create-databases",
        "Creating and migrating organization databases"
    )
    
    if not success:
        print("❌ Failed to set up organization databases. Exiting.")
        return 1

    # Step 4: Test the setup with relational data
    print("\n📋 Step 4: Setting up test data")
    for org in organizations:
        success = run_command(
            f"python manage.py setup_relational_test_data --org-id={org.id}",
            f"Setting up test data for organization: {org.name}"
        )
        if not success:
            print(f"⚠️ Warning: Failed to set up test data for {org.name}")

    # Step 5: Summary and instructions
    print("\n" + "=" * 60)
    print("🎉 ORGANIZATION DATABASE ROUTING SETUP COMPLETE!")
    print("=" * 60)
    
    print("\n📋 What was set up:")
    print("├── Database router for multi-tenant organizations")
    print("├── Organization context middleware")
    print("├── Enhanced mixins for organization-specific data access")
    print("└── Organization-specific databases and migrations")
    
    print(f"\n🏢 Organization databases created:")
    for org in organizations:
        print(f"├── Database: orgdata_{org.id} for '{org.name}'")
    
    print("\n🔐 Test the setup:")
    print("1. Start your Django development server:")
    print("   cd backend && python manage.py runserver")
    print("2. Start your frontend development server:")
    print("   cd frontend && npm run dev")
    print("3. Login with: relational@test.com / testpass123")
    print("4. Navigate to /relational-ui")
    print("5. You should now see data from the organization-specific database!")
    
    print("\n🛠️ Troubleshooting:")
    print("├── Check logs if the relational-ui page still redirects to login")
    print("├── Verify organization databases exist in PostgreSQL")
    print("├── Ensure users are properly assigned to organizations")
    print("└── Run: python manage.py migrate_org_databases --org-id=<ID> for specific orgs")
    
    print("\n✨ The multi-tenant database routing is now active!")
    return 0


if __name__ == "__main__":
    sys.exit(main())