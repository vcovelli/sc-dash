#!/usr/bin/env python3
"""
Relational UI Testing Setup Script

This script sets up a complete testing environment for the relational-ui page,
including authentication and test data.

Usage:
    python setup_relational_ui_testing.py [--clean]
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from accounts.models import Organization, CustomUser


def run_command(command, description, check=True):
    """Run a Django management command"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
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
    parser = argparse.ArgumentParser(description="Set up relational-ui testing environment")
    parser.add_argument('--clean', action='store_true', help='Clean existing test data first')
    args = parser.parse_args()

    print("🚀 Setting up Relational UI Testing Environment")
    print("=" * 60)

    # Change to backend directory for Django commands
    backend_dir = BASE_DIR
    os.chdir(backend_dir)

    # Step 1: Set up test organization and users
    clean_flag = "--clean" if args.clean else ""
    success = run_command(
        f"python manage.py setup_test_org {clean_flag}",
        "Setting up test organization and users"
    )
    
    if not success:
        print("❌ Failed to set up test organization. Exiting.")
        return 1

    # Step 2: Get the test organization ID
    try:
        test_org = Organization.objects.get(name="Test Organization")
        org_id = test_org.id
        print(f"✅ Using test organization ID: {org_id}")
    except Organization.DoesNotExist:
        print("❌ Test organization not found. Please check the setup_test_org command.")
        return 1

    # Step 3: Set up relational test data
    success = run_command(
        f"python manage.py setup_relational_test_data --org-id={org_id} {clean_flag}",
        "Setting up relational test data"
    )
    
    if not success:
        print("❌ Failed to set up relational test data. Exiting.")
        return 1

    # Step 4: Summary and instructions
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETE!")
    print("=" * 60)
    
    print("\n📋 What was created:")
    print("├── Test Organization: 'Test Organization'")
    print("├── Test Users:")
    print("│   ├── owner@test.com (Owner)")
    print("│   ├── manager@test.com (National Manager)")
    print("│   ├── employee@test.com (Employee)")
    print("│   ├── client@test.com (Client)")
    print("│   ├── readonly@test.com (Read Only)")
    print("│   └── relational@test.com (Owner - for relational UI)")
    print("├── Relational Data:")
    print("│   ├── 5 Suppliers")
    print("│   ├── 5 Warehouses")
    print("│   ├── 8 Customers")
    print("│   ├── 12 Products")
    print("│   ├── ~30 Inventory items")
    print("│   ├── 25 Orders")
    print("│   └── ~20 Shipments")
    
    print("\n🔐 Login Credentials:")
    print("├── General testing: owner@test.com / testpass123")
    print("└── Relational UI: relational@test.com / testpass123")
    
    print("\n🌐 Testing the Relational UI:")
    print("1. Start your frontend development server")
    print("2. Navigate to /login")
    print("3. Login with relational@test.com / testpass123")
    print("4. Navigate to /relational-ui")
    print("5. You should see populated data in all tables!")
    
    print("\n🛠️ Development Tips:")
    print("├── Backend API available at: http://localhost:8000/api/")
    print("├── View organization data at: /api/suppliers/, /api/products/, etc.")
    print("├── Clean and regenerate data: python setup_relational_ui_testing.py --clean")
    print("└── Check logs if issues persist")
    
    print("\n✨ Happy testing!")
    return 0


if __name__ == "__main__":
    sys.exit(main())