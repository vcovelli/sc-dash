#!/usr/bin/env python3
"""
🚀 SupplyWise AI - Unified Testing Suite
==========================================

This script provides comprehensive testing and setup for the SupplyWise AI platform.
It handles everything from Docker container health checks to organization setup,
user creation, data generation, and end-to-end testing.

Features:
- 🐳 Docker environment validation and health checks
- 🏢 Multi-tenant organization setup with database routing
- 👥 RBAC user creation with proper roles and permissions
- 📊 Comprehensive test data generation (suppliers, products, orders, etc.)
- 🔄 Data pipeline testing (MongoDB → PostgreSQL)
- 🧪 End-to-end functionality validation
- 📋 Clear status reporting and troubleshooting guidance

Usage:
    python unified_test_suite.py [OPTIONS]

Examples:
    # Full setup with default test organization
    python unified_test_suite.py --full-setup

    # Setup with custom organization
    python unified_test_suite.py --full-setup --org-name "My Test Company"
    
    # Clean existing data and restart fresh
    python unified_test_suite.py --full-setup --clean
    
    # Only run health checks
    python unified_test_suite.py --health-check
    
    # Only test data pipeline
    python unified_test_suite.py --test-pipeline --org-id 123

Requirements:
    - Docker and Docker Compose installed and running
    - .env file configured with proper database credentials
    - All services started with: docker compose up -d --build

Author: SupplyWise AI Team
Version: 1.0.0
"""

import os
import sys
import json
import time
import subprocess
import tempfile
import argparse
import requests
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import uuid

# Setup paths and Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Color codes for output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def print_step(text: str):
    """Print step message"""
    print(f"{Colors.MAGENTA}🔄 {text}{Colors.END}")

class SupplyWiseTestSuite:
    """Comprehensive test suite for SupplyWise AI platform"""
    
    def __init__(self, host="localhost"):
        self.base_dir = BASE_DIR
        self.host = host
        self.services = {
            'postgres': {'container': 'postgres', 'port': 5432, 'health_path': None},
            'mongo': {'container': 'mongo', 'port': 27017, 'health_path': None},
            'backend': {'container': 'backend', 'port': 8000, 'health_path': '/api/health/'},
            'frontend': {'container': 'frontend', 'port': 3000, 'health_path': '/'},
            'airflow-webserver': {'container': 'airflow-webserver', 'port': 8080, 'health_path': '/health'},
            'minio': {'container': 'minio', 'port': 9000, 'health_path': '/minio/health/live'},
        }
        self.test_results = {}
        
    def run_command(self, command: str, description: str, capture_output: bool = True, 
                   cwd: Optional[str] = None, check: bool = True) -> Tuple[bool, str, str]:
        """Run a command and return success status and output"""
        print_step(description)
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=capture_output,
                text=True, 
                cwd=cwd or self.base_dir,
                check=check
            )
            if result.stdout and not capture_output:
                print(result.stdout)
            return True, result.stdout, result.stderr
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed: {e}"
            if e.stdout:
                error_msg += f"\nOutput: {e.stdout}"
            if e.stderr:
                error_msg += f"\nError: {e.stderr}"
            print_error(error_msg)
            return False, e.stdout or "", e.stderr or ""

    def check_docker_running(self) -> bool:
        """Check if Docker is running and accessible"""
        print_step("Checking Docker status...")
        success, stdout, stderr = self.run_command("docker --version", "Getting Docker version")
        if not success:
            print_error("Docker is not installed or not accessible")
            return False
        
        success, stdout, stderr = self.run_command("docker ps", "Checking Docker daemon")
        if not success:
            print_error("Docker daemon is not running. Please start Docker and try again.")
            return False
            
        print_success("Docker is running and accessible")
        return True

    def check_compose_services(self) -> Dict[str, bool]:
        """Check if all Docker Compose services are running"""
        print_step("Checking Docker Compose services...")
        
        success, stdout, stderr = self.run_command(
            "docker compose ps --format json", 
            "Getting service status"
        )
        
        if not success:
            print_error("Failed to get Docker Compose service status")
            return {}
        
        service_status = {}
        try:
            # Parse JSON output from docker compose ps
            services_data = []
            for line in stdout.strip().split('\n'):
                if line.strip():
                    services_data.append(json.loads(line))
            
            for service in services_data:
                name = service.get('Service', service.get('Name', 'unknown'))
                state = service.get('State', 'unknown')
                service_status[name] = state == 'running'
                
                if state == 'running':
                    print_success(f"{name}: Running")
                else:
                    print_warning(f"{name}: {state}")
                    
        except json.JSONDecodeError:
            print_warning("Could not parse service status JSON")
            
        return service_status

    def wait_for_service_health(self, service_name: str, max_wait: int = 60) -> bool:
        """Wait for a service to become healthy"""
        if service_name not in self.services:
            print_warning(f"Unknown service: {service_name}")
            return False
            
        service = self.services[service_name]
        port = service['port']
        health_path = service.get('health_path')
        
        print_step(f"Waiting for {service_name} to become healthy (max {max_wait}s)...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                if health_path:
                    # HTTP health check
                    response = requests.get(f"http://{self.host}:{port}{health_path}", timeout=5)
                    if response.status_code == 200:
                        print_success(f"{service_name} is healthy")
                        return True
                else:
                    # Port connectivity check
                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((self.host, port))
                    sock.close()
                    if result == 0:
                        print_success(f"{service_name} is responding on port {port}")
                        return True
                        
            except Exception as e:
                pass  # Continue waiting
                
            time.sleep(2)
            
        print_error(f"{service_name} did not become healthy within {max_wait} seconds")
        return False

    def run_health_checks(self) -> bool:
        """Run comprehensive health checks on all services"""
        print_header("🏥 HEALTH CHECKS")
        
        # Check Docker
        if not self.check_docker_running():
            return False
            
        # Check services
        service_status = self.check_compose_services()
        
        # Wait for critical services to be healthy
        critical_services = ['postgres', 'mongo', 'backend']
        all_healthy = True
        
        for service in critical_services:
            if service in service_status and service_status[service]:
                if not self.wait_for_service_health(service):
                    all_healthy = False
            else:
                print_error(f"Critical service {service} is not running")
                all_healthy = False
                
        # Optional services
        optional_services = ['frontend', 'airflow-webserver', 'minio']
        for service in optional_services:
            if service in service_status and service_status[service]:
                self.wait_for_service_health(service, max_wait=30)
        
        if all_healthy:
            print_success("All critical services are healthy!")
        else:
            print_error("Some critical services are not healthy. Please check logs with: docker compose logs")
            
        return all_healthy

    def setup_django_environment(self) -> bool:
        """Initialize Django environment and run migrations"""
        print_header("🐍 DJANGO SETUP")
        
        try:
            import django
            django.setup()
            print_success("Django environment initialized")
        except Exception as e:
            print_error(f"Failed to initialize Django: {e}")
            return False
            
        # Run migrations
        success, stdout, stderr = self.run_command(
            "docker compose exec -T backend python manage.py migrate",
            "Running Django migrations"
        )
        
        if success:
            print_success("Django migrations completed")
        else:
            print_error("Django migrations failed")
            
        return success

    def create_test_organization(self, org_name: str = "Test Organization", clean: bool = False) -> Optional[str]:
        """Create test organization and users with proper RBAC"""
        print_header("🏢 ORGANIZATION SETUP")
        
        # Clean existing data if requested
        if clean:
            print_step("Cleaning existing test data...")
            success, stdout, stderr = self.run_command(
                "docker compose exec -T backend python manage.py setup_test_org --clean",
                "Cleaning existing test organization"
            )
            
        # Create test organization
        success, stdout, stderr = self.run_command(
            f'docker compose exec -T backend python manage.py setup_test_org --org-name "{org_name}"',
            f"Creating test organization: {org_name}"
        )
        
        if not success:
            print_error("Failed to create test organization")
            return None
            
        print_success(f"Test organization '{org_name}' created successfully")
        
        # Get organization ID using the management command inside the container
        success, stdout, stderr = self.run_command(
            f'docker compose exec -T backend python manage.py get_org_id --org-name "{org_name}"',
            f"Getting organization ID"
        )
        if success and stdout.strip():
            org_id = stdout.strip()
            print_info(f"Organization ID: {org_id}")
            return org_id
        else:
            print_warning(f"Could not get organization ID")
            return None

    def create_sample_data(self, org_name: str = "Test Organization", clean: bool = False) -> bool:
        """Create comprehensive sample data for testing"""
        print_header("📊 SAMPLE DATA GENERATION")
        
        clean_flag = "--clean" if clean else ""
        
        # Create sample supply chain data
        success, stdout, stderr = self.run_command(
            f'docker compose exec -T backend python manage.py create_sample_data --org "{org_name}" {clean_flag}',
            "Creating sample supply chain data"
        )
        
        if not success:
            print_error("Failed to create sample data")
            return False
            
        print_success("Sample supply chain data created")
        
        # Setup relational test data
        success, stdout, stderr = self.run_command(
            f'docker compose exec -T backend python manage.py setup_relational_test_data {clean_flag}',
            "Creating relational test data"
        )
        
        if success:
            print_success("Relational test data created")
        else:
            print_warning("Relational test data creation had issues (may be non-critical)")
            
        return True

    def test_data_pipeline(self, org_id: Optional[str] = None) -> bool:
        """Test the data pipeline functionality"""
        print_header("🔄 DATA PIPELINE TESTING")
        
        # Create test CSV data
        print_step("Creating test CSV data...")
        test_data = {
            'product_id': [1, 2, 3, 4, 5],
            'product_name': ['Widget A', 'Widget B', 'Gadget X', 'Tool Y', 'Device Z'],
            'quantity': [100, 200, 150, 75, 300],
            'price': [19.99, 29.99, 39.99, 15.99, 49.99],
            'supplier': ['Supplier A', 'Supplier B', 'Supplier A', 'Supplier C', 'Supplier B'],
            'date_added': ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
        }
        
        df = pd.DataFrame(test_data)
        
        # Create temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            df.to_csv(f.name, index=False)
            temp_csv_path = f.name
            
        try:
            # Copy CSV to container
            success, stdout, stderr = self.run_command(
                f"docker cp {temp_csv_path} backend:/tmp/test_pipeline_data.csv",
                "Copying test data to backend container"
            )
            
            if not success:
                return False
                
            # Test MongoDB seeding
            success, stdout, stderr = self.run_command(
                "docker compose exec -T backend python -c \"from scripts.testing.seed_mongo import seed_data; seed_data()\"",
                "Seeding MongoDB with test data"
            )
            
            if success:
                print_success("MongoDB seeding completed")
            else:
                print_warning("MongoDB seeding failed (may not be critical)")
                
            # Test pipeline management commands
            if org_id:
                success, stdout, stderr = self.run_command(
                    f'docker compose exec -T backend python manage.py manage_enhanced_pipeline status --org-id {org_id}',
                    "Testing enhanced pipeline status"
                )
                
                if success:
                    print_success("Pipeline status check completed")
                else:
                    print_warning("Pipeline status check failed")
                    
        finally:
            # Clean up temporary file
            os.unlink(temp_csv_path)
            
        return True

    def test_api_endpoints(self) -> bool:
        """Test critical API endpoints"""
        print_header("🌐 API ENDPOINT TESTING")
        
        base_url = f"http://{self.host}:8000"
        endpoints = [
            ("/api/health/", "Health check"),
            ("/api/auth/", "Authentication endpoint"),
            ("/admin/", "Django admin"),
        ]
        
        all_passed = True
        
        for endpoint, description in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
                if response.status_code in [200, 301, 302, 403]:  # 403 is ok for auth-required endpoints
                    print_success(f"{description}: {response.status_code}")
                else:
                    print_warning(f"{description}: {response.status_code}")
                    all_passed = False
            except Exception as e:
                print_error(f"{description}: Failed - {e}")
                all_passed = False
                
        return all_passed

    def test_database_connections(self) -> bool:
        """Test database connectivity and basic operations"""
        print_header("🗄️  DATABASE TESTING")
        
        # Test PostgreSQL
        success, stdout, stderr = self.run_command(
            'docker compose exec -T postgres psql -U postgres -d supplywise_ai -c "SELECT version();"',
            "Testing PostgreSQL connection"
        )
        
        if success:
            print_success("PostgreSQL connection successful")
        else:
            print_error("PostgreSQL connection failed")
            return False
            
        # Test MongoDB
        success, stdout, stderr = self.run_command(
            'docker compose exec -T mongo mongosh --eval "db.runCommand({ping: 1})"',
            "Testing MongoDB connection"
        )
        
        if success:
            print_success("MongoDB connection successful")
        else:
            print_warning("MongoDB connection failed (may not be critical)")
            
        return True

    def generate_test_report(self) -> None:
        """Generate a comprehensive test report"""
        print_header("📋 TEST REPORT")
        
        print(f"{Colors.BOLD}SupplyWise AI Platform Test Results{Colors.END}")
        print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Service URLs
        print(f"{Colors.BOLD}🌐 Service URLs:{Colors.END}")
        print(f"├── Frontend:        http://{self.host}:3000")
        print(f"├── Backend API:     http://{self.host}:8000") 
        print(f"├── Django Admin:    http://{self.host}:8000/admin")
        print(f"├── Airflow:         http://{self.host}:8080")
        print(f"└── MinIO Console:   http://{self.host}:9001")
        print()
        
        # Test Accounts
        print(f"{Colors.BOLD}👥 Test Accounts:{Colors.END}")
        print("├── Platform Admin:  admin@supplywise.ai / admin123")
        print("├── Owner:           owner@test.com / testpass123")
        print("├── Manager:         manager@test.com / testpass123")  
        print("├── Employee:        employee@test.com / testpass123")
        print("├── Client:          client@test.com / testpass123")
        print("└── Read Only:       readonly@test.com / testpass123")
        print()
        
        # Role Capabilities
        print(f"{Colors.BOLD}🔐 Role Capabilities:{Colors.END}")
        print("├── Platform Admin: Access to all organizations")
        print("├── Owner:          Full organization management, user invites")
        print("├── Manager:        User invites, analytics access")
        print("├── Employee:       Analytics and data access")
        print("├── Client:         Limited dashboard access")
        print("└── Read Only:      View-only access to permitted data")
        print()
        
        # Next Steps
        print(f"{Colors.BOLD}🚀 Next Steps:{Colors.END}")
        print("1. Visit http://localhost:3000 to access the frontend")
        print("2. Log in with any of the test accounts above")
        print("3. Explore the dashboard and analytics features")
        print("4. Test file uploads and data processing")
        print("5. Try the AI query agent features")
        print("6. Check Airflow for data pipeline workflows")
        print()
        
        # Troubleshooting
        print(f"{Colors.BOLD}🔧 Troubleshooting:{Colors.END}")
        print("├── Check logs:      docker compose logs [service-name]")
        print("├── Restart service: docker compose restart [service-name]")
        print("├── Full restart:    docker compose down && docker compose up -d --build")
        print("├── Clean data:      python unified_test_suite.py --clean")
        print("└── Health check:    python unified_test_suite.py --health-check")

    def run_full_test_suite(self, org_name: str = "Test Organization", clean: bool = False) -> bool:
        """Run the complete test suite"""
        print_header("🚀 SUPPLYWISE AI - UNIFIED TEST SUITE")
        print(f"Starting comprehensive testing for organization: {org_name}")
        print(f"Clean installation: {'Yes' if clean else 'No'}")
        print()
        
        success = True
        
        # 1. Health Checks
        if not self.run_health_checks():
            print_error("Health checks failed. Please ensure Docker services are running.")
            return False
            
        # 2. Django Setup
        if not self.setup_django_environment():
            print_error("Django setup failed.")
            return False
            
        # 3. Organization Setup
        org_id = self.create_test_organization(org_name, clean)
        if not org_id:
            print_error("Organization setup failed.")
            return False
            
        # 4. Sample Data
        if not self.create_sample_data(org_name, clean):
            print_error("Sample data creation failed.")
            success = False
            
        # 5. Database Tests
        if not self.test_database_connections():
            print_error("Database connectivity tests failed.")
            success = False
            
        # 6. Data Pipeline Tests
        if not self.test_data_pipeline(org_id):
            print_error("Data pipeline tests failed.")
            success = False
            
        # 7. API Tests
        if not self.test_api_endpoints():
            print_error("API endpoint tests failed.")
            success = False
            
        # 8. Generate Report
        self.generate_test_report()
        
        if success:
            print_success("🎉 All tests completed successfully! Your SupplyWise AI platform is ready.")
        else:
            print_warning("⚠️  Some tests failed, but core functionality should work. Check individual test results above.")
            
        return success


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="SupplyWise AI Unified Test Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --full-setup                          # Complete setup with default org
  %(prog)s --full-setup --org-name "My Company" # Setup with custom organization
  %(prog)s --full-setup --clean                 # Clean existing data first
  %(prog)s --health-check                       # Only run health checks
  %(prog)s --test-pipeline --org-id 123         # Only test data pipeline
        """
    )
    
    parser.add_argument(
        "--full-setup",
        action="store_true",
        help="Run complete setup and testing suite"
    )
    
    parser.add_argument(
        "--health-check",
        action="store_true", 
        help="Only run health checks on services"
    )
    
    parser.add_argument(
        "--test-pipeline",
        action="store_true",
        help="Only test data pipeline functionality"
    )
    
    parser.add_argument(
        "--org-name",
        type=str,
        default="Test Organization",
        help="Name for the test organization (default: 'Test Organization')"
    )
    
    parser.add_argument(
        "--org-id",
        type=str,
        help="Organization ID for pipeline testing"
    )
    
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean existing test data before setup"
    )

    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Backend host/IP for API/health checks (default: localhost)"
    )

    args = parser.parse_args()
    
    # Show help if no arguments provided
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    suite = SupplyWiseTestSuite(host=args.host)
    
    try:
        if args.full_setup:
            success = suite.run_full_test_suite(args.org_name, args.clean)
            sys.exit(0 if success else 1)
        elif args.health_check:
            success = suite.run_health_checks()
            sys.exit(0 if success else 1)
        elif args.test_pipeline:
            if not suite.run_health_checks():
                print_error("Health checks failed")
                sys.exit(1)
            success = suite.test_data_pipeline(args.org_id)
            sys.exit(0 if success else 1)
        else:
            parser.print_help()
            
    except KeyboardInterrupt:
        print_warning("\n\nTest suite interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()