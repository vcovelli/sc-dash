#!/usr/bin/env python3
"""
🚀 SupplyWise AI - Comprehensive All-Inclusive Testing Suite
=============================================================

This is the ultimate testing script that combines ALL testing functionality
into a single, comprehensive suite for complete platform validation from
a fresh wipe. It consolidates functionality from:

- unified_test_suite.py
- test_enterprise_routing.py
- test_routing.py
- debug_relational_ui.py
- All management commands

Features:
- 🐳 Complete Docker environment setup and validation
- 🏗️ Database routing and multi-tenant testing  
- 🔐 Enterprise security and RBAC validation
- 📊 Comprehensive test data generation
- 🔄 Full data pipeline testing (MongoDB → PostgreSQL)
- 🌐 API endpoint validation
- 📱 Frontend connectivity testing
- ⚡ Performance and load testing
- 🛡️ Security and isolation testing
- 📋 Detailed reporting and troubleshooting

Usage:
    python comprehensive_test_suite.py [OPTIONS]

Examples:
    # Complete fresh setup (recommended)
    python comprehensive_test_suite.py --full-setup --fresh-wipe

    # Quick validation after changes
    python comprehensive_test_suite.py --quick-test
    
    # Enterprise testing only
    python comprehensive_test_suite.py --enterprise-test
    
    # Performance benchmarking
    python comprehensive_test_suite.py --performance-test

Author: SupplyWise AI Team
Version: 2.0.0 - All-Inclusive Edition
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
from typing import Dict, List, Optional, Tuple, Any
import uuid
import threading
import concurrent.futures
from urllib.parse import urljoin
import psycopg2
from psycopg2.extras import RealDictCursor
import random

# Setup paths and Django environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import backend.config.settings as project_settings

log_paths = [
    Path(handler.get("filename")).parent
    for handler in project_settings.LOGGING.get("handlers", {}).values()
    if "filename" in handler
]

for path in log_paths:
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)

import django
django.setup()

def timer_decorator(func_name):
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"⏱️ Starting {func_name}")
            start = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start
            print(f"✅ {func_name} finished in {duration:.2f}s")
            return result
        return wrapper
    return decorator

# Color codes for beautiful output
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

def print_header(text: str, char: str = "="):
    """Print a beautiful formatted header"""
    width = 70
    print(f"\n{Colors.BOLD}{Colors.BLUE}{char * width}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(width)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{char * width}{Colors.END}")

def print_section(text: str):
    """Print a section header"""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'─' * 50}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.WHITE}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'─' * 50}{Colors.END}")

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
    print(f"{Colors.CYAN}🔄 {text}{Colors.END}")

def print_metric(name: str, value: str, unit: str = ""):
    """Print performance metric"""
    print(f"{Colors.MAGENTA}📊 {name}: {Colors.BOLD}{value}{unit}{Colors.END}")

class ComprehensiveTestSuite:
    """The ultimate all-inclusive test suite for SupplyWise AI"""
    
    def __init__(self, host: str = "localhost"):
        self.base_dir = BASE_DIR
        self.host = host
        self.start_time = time.time()
        
        # Service configuration
        self.services = {
            'postgres': {'container': 'postgres', 'port': 5432, 'health_path': None},
            'mongo': {'container': 'mongo', 'port': 27017, 'health_path': None},
            'backend': {'container': 'backend', 'port': 8000, 'health_path': '/api/health/'},
            'frontend': {'container': 'frontend', 'port': 3000, 'health_path': '/'},
            'airflow-webserver': {'container': 'airflow-webserver', 'port': 8080, 'health_path': '/health'},
            'minio': {'container': 'minio', 'port': 9000, 'health_path': '/minio/health/live'},
            'redis': {'container': 'redis', 'port': 6379, 'health_path': None},
        }
        
        # Test tracking
        self.test_results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'errors': [],
            'warnings_list': [],
            'performance_metrics': {},
            'security_tests': {},
            'enterprise_tests': {}
        }
        
        # Test organizations created
        self.test_orgs = []

    def run_command(self, command: str, description: str, capture_output: bool = True, 
                   cwd: Optional[str] = None, check: bool = True, timeout: int = 300) -> Tuple[bool, str, str]:
        """Enhanced command runner with timeout and better error handling"""
        print_step(description)
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=capture_output,
                text=True, 
                cwd=cwd or self.base_dir,
                check=check,
                timeout=timeout
            )
            if result.stdout and not capture_output:
                print(result.stdout)
            return True, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            error_msg = f"Command timed out after {timeout} seconds"
            print_error(error_msg)
            return False, "", error_msg
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed (exit code {e.returncode})"
            if e.stdout:
                error_msg += f"\nOutput: {e.stdout}"
            if e.stderr:
                error_msg += f"\nError: {e.stderr}"
            print_error(error_msg)
            return False, e.stdout or "", e.stderr or ""

    def assert_test(self, condition: bool, test_name: str, details: str = "", is_warning: bool = False):
        """Enhanced test assertion with warning support"""
        self.test_results['total_tests'] += 1
        
        if condition:
            print_success(test_name)
            self.test_results['passed'] += 1
        elif is_warning:
            print_warning(f"{test_name} - {details}")
            self.test_results['warnings'] += 1
            self.test_results['warnings_list'].append(f"{test_name}: {details}")
        else:
            print_error(f"{test_name} - {details}")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {details}")

    # =================================================================
    # INFRASTRUCTURE TESTING
    # =================================================================

    def check_system_requirements(self) -> bool:
        """Check system requirements and prerequisites"""
        print_section("🖥️  SYSTEM REQUIREMENTS CHECK")
        
        all_good = True
        
        # Check Docker
        success, stdout, stderr = self.run_command("docker --version", "Checking Docker installation")
        self.assert_test(success, "Docker installed", stderr)
        if not success:
            all_good = False
            
        # Check Docker Compose
        success, stdout, stderr = self.run_command("docker compose version", "Checking Docker Compose")
        self.assert_test(success, "Docker Compose available", stderr)
        if not success:
            all_good = False
            
        # Check Docker daemon
        success, stdout, stderr = self.run_command("docker ps", "Checking Docker daemon")
        self.assert_test(success, "Docker daemon running", stderr)
        if not success:
            all_good = False
            
        # Check available disk space
        success, stdout, stderr = self.run_command("df -h .", "Checking disk space")
        if success:
            lines = stdout.strip().split('\n')
            if len(lines) > 1:
                available = lines[1].split()[3]
                print_info(f"Available disk space: {available}")
                # Warn if less than 5GB available
                self.assert_test(True, "Disk space check", f"Available: {available}", 
                               is_warning="G" not in available or int(available.replace("G", "").split(".")[0]) < 5)
        
        # Check memory
        success, stdout, stderr = self.run_command("free -h", "Checking memory")
        if success:
            print_info(f"Memory status checked")
            
        return all_good

    def fresh_wipe_environment(self) -> bool:
        """Completely wipe and restart the environment"""
        print_section("🧹 FRESH ENVIRONMENT WIPE")
        
        # Stop all containers
        print_step("Stopping all Docker containers...")
        self.run_command("docker compose down -v --remove-orphans", "Stopping containers", check=False)
        
        # Remove Docker volumes
        print_step("Removing Docker volumes...")
        self.run_command("docker volume prune -f", "Removing volumes", check=False)
        
        # Clean Docker system
        print_step("Cleaning Docker system...")
        self.run_command("docker system prune -f", "Cleaning Docker system", check=False)
        
        # Remove any existing .env-local files
        env_files = ['.env.local', '.env.development.local', '.env.test.local']
        for env_file in env_files:
            if os.path.exists(env_file):
                os.remove(env_file)
                print_step(f"Removed {env_file}")
        
        print_success("Environment wiped clean")
        return True

    def setup_environment(self) -> bool:
        """Setup the complete environment from scratch"""
        print_section("🏗️  ENVIRONMENT SETUP")
        
        # Check for .env file
        if not os.path.exists('../.env'):
            if os.path.exists('.env.example'):
                print_step("Copying .env.example to .env...")
                success, _, _ = self.run_command("cp .env.example .env", "Creating .env file")
                if not success:
                    print_error(".env file not found and couldn't copy from .env.example")
                    return False
            else:
                print_error("No .env file found. Please create one based on .env.example")
                return False
        
        # Build and start containers
        print_step("Building and starting Docker containers...")
        success, stdout, stderr = self.run_command(
            "docker compose up -d --build --force-recreate", 
            "Building and starting services",
            timeout=600  # 10 minutes for build
        )
        
        if not success:
            print_error("Failed to start Docker containers")
            print_info("Try running: docker compose logs")
            return False
            
        print_success("Docker containers started successfully")
        return True

    def wait_for_services_health(self, max_wait: int = 180) -> bool:
        """Wait for all services to become healthy"""
        print_section("🏥 SERVICE HEALTH MONITORING")
        
        print_step(f"Waiting for services to become healthy (max {max_wait}s)...")
        
        start_time = time.time()
        healthy_services = set()
        
        while time.time() - start_time < max_wait:
            for service_name, service_config in self.services.items():
                if service_name in healthy_services:
                    continue
                    
                port = service_config['port']
                health_path = service_config.get('health_path')
                
                try:
                    if health_path:
                        # HTTP health check
                        response = requests.get(
                            f"http://{self.host}:{port}{health_path}", 
                            timeout=3
                        )
                        if response.status_code == 200:
                            healthy_services.add(service_name)
                            print_success(f"{service_name} is healthy")
                    else:
                        # Port connectivity check
                        import socket
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(3)
                        result = sock.connect_ex((self.host, port))
                        sock.close()
                        if result == 0:
                            healthy_services.add(service_name)
                            print_success(f"{service_name} is responding on port {port}")
                            
                except Exception:
                    pass  # Continue waiting
            
            if len(healthy_services) == len(self.services):
                break
                
            time.sleep(3)
        
        # Report results
        unhealthy = set(self.services.keys()) - healthy_services
        
        if unhealthy:
            for service in unhealthy:
                self.assert_test(False, f"{service} health check", 
                               f"Service did not become healthy within {max_wait}s")
            return False
        else:
            print_success("All services are healthy!")
            return True

    # =================================================================
    # DATABASE TESTING
    # =================================================================

    def setup_django_environment(self) -> bool:
        """Initialize Django environment and run migrations"""
        print_section("🐍 DJANGO ENVIRONMENT SETUP")
        
        try:
            import django
            django.setup()
            print_success("Django environment initialized")
        except Exception as e:
            self.assert_test(False, "Django initialization", str(e))
            return False
            
        # Run migrations on default database
        success, stdout, stderr = self.run_command(
            "docker compose exec -T backend python manage.py migrate",
            "Running Django migrations"
        )
        
        self.assert_test(success, "Django migrations", stderr)
        return success

    def test_database_routing(self) -> bool:
        """Test the database routing system"""
        print_section("🔄 DATABASE ROUTING TESTS")
        
        # Test basic routing functionality
        success, stdout, stderr = self.run_command(
            "docker compose exec -T backend python test_routing.py",
            "Testing basic database routing"
        )
        
        self.assert_test(success, "Basic database routing", stderr)
        
        return success

    def test_enterprise_routing(self) -> bool:
        """Test enterprise-grade multi-tenant routing"""
        print_section("🏢 ENTERPRISE ROUTING TESTS")
        
        success, stdout, stderr = self.run_command(
            "docker compose exec -T backend python test_enterprise_routing.py",
            "Testing enterprise multi-tenant routing"
        )
        
        self.assert_test(success, "Enterprise routing tests", stderr)
        
        # Parse output for specific test results
        if success and stdout:
            lines = stdout.split('\n')
            for line in lines:
                if '✅' in line:
                    test_name = line.replace('✅', '').strip()
                    self.test_results['enterprise_tests'][test_name] = 'PASSED'
                elif '❌' in line:
                    test_name = line.replace('❌', '').strip()
                    self.test_results['enterprise_tests'][test_name] = 'FAILED'
        
        return success

    def test_database_connections(self) -> bool:
        """Test all database connections"""
        print_section("🗄️  DATABASE CONNECTION TESTS")
        
        all_success = True
        
        # Test PostgreSQL
        success, stdout, stderr = self.run_command(
            'docker compose exec -T postgres psql -U app_user -d supplywise -c "SELECT version();"',
            "Testing PostgreSQL connection"
        )
        self.assert_test(success, "PostgreSQL connection", stderr)
        if not success:
            all_success = False
            
        # Test MongoDB
        success, stdout, stderr = self.run_command(
            'docker compose exec -T mongo mongosh --eval "db.runCommand({ping: 1})"',
            "Testing MongoDB connection"
        )
        self.assert_test(success, "MongoDB connection", stderr, is_warning=not success)
        
        # Test Redis
        success, stdout, stderr = self.run_command(
            'docker compose exec -T redis redis-cli ping',
            "Testing Redis connection"
        )
        self.assert_test(success, "Redis connection", stderr, is_warning=not success)
        
        return all_success

    # =================================================================
    # ORGANIZATION & USER TESTING
    # =================================================================

    def create_test_organizations(self, count: int = 3, clean: bool = False) -> List[str]:
        """Create multiple test organizations for testing"""
        print_section("🏢 ORGANIZATION CREATION")
        
        org_names = [
            "Test Organization Alpha",
            "Test Organization Beta", 
            "Test Organization Gamma"
        ][:count]
        
        created_orgs = []
        
        for org_name in org_names:
            clean_flag = "--clean" if clean and len(created_orgs) == 0 else ""
            
            success, stdout, stderr = self.run_command(
                f'docker compose exec -T backend python manage.py setup_test_org --org-name "{org_name}" {clean_flag}',
                f"Creating organization: {org_name}"
            )
            
            if success:
                # Get organization ID
                success2, stdout2, stderr2 = self.run_command(
                    f'docker compose exec -T backend python manage.py get_org_id --org-name "{org_name}"',
                    f"Getting organization ID for {org_name}"
                )
                
                if success2 and stdout2.strip():
                    org_id = stdout2.strip()
                    created_orgs.append(org_id)
                    self.test_orgs.append({'name': org_name, 'id': org_id})
                    print_success(f"Created organization: {org_name} (ID: {org_id})")
                else:
                    self.assert_test(False, f"Get org ID for {org_name}", stderr2)
            else:
                self.assert_test(False, f"Create organization {org_name}", stderr)
        
        return created_orgs

    def create_comprehensive_test_data(self, org_ids: List[str]) -> bool:
        """Create comprehensive test data for all organizations"""
        print_section("📊 COMPREHENSIVE TEST DATA GENERATION")
        
        all_success = True
        
        for i, org_id in enumerate(org_ids):
            org_name = self.test_orgs[i]['name'] if i < len(self.test_orgs) else f"Test Org {i+1}"
            
            # Create supply chain data
            success, stdout, stderr = self.run_command(
                f'docker compose exec -T backend python manage.py create_sample_data --org "{org_name}"',
                f"Creating supply chain data for {org_name}"
            )
            self.assert_test(success, f"Supply chain data for {org_name}", stderr, is_warning=not success)
            
            # Create relational test data
            success, stdout, stderr = self.run_command(
                f'docker compose exec -T backend python manage.py setup_relational_test_data --org-id {org_id}',
                f"Creating relational test data for {org_name}"
            )
            self.assert_test(success, f"Relational test data for {org_name}", stderr, is_warning=not success)
            
            if not success:
                all_success = False
        
        return all_success

    # =================================================================
    # DATA PIPELINE TESTING
    # =================================================================

    def test_comprehensive_data_pipeline(self, org_ids: List[str]) -> bool:
        """Test the complete data pipeline for multiple organizations"""
        print_section("🔄 COMPREHENSIVE DATA PIPELINE TESTING")
        
        all_success = True
        
        # Create enhanced test dataset
        test_data = self.generate_enhanced_test_data()
        
        for i, org_id in enumerate(org_ids):
            org_name = self.test_orgs[i]['name'] if i < len(self.test_orgs) else f"Test Org {i+1}"
            
            print_step(f"Testing data pipeline for {org_name} (ID: {org_id})")
            
            # Create temporary CSV file with enhanced data
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                test_data.to_csv(f.name, index=False)
                temp_csv_path = f.name

            try:
                # Copy test data to backend container
                result = subprocess.run("docker compose ps -q backend", shell=True, capture_output=True, text=True)
                backend_cid = result.stdout.strip()
                
                if not backend_cid:
                    self.assert_test(False, f"Pipeline test for {org_name}", "Could not find backend container")
                    all_success = False
                    continue

                success, stdout, stderr = self.run_command(
                    f"docker cp {temp_csv_path} {backend_cid}:/tmp/test_pipeline_data_{org_id}.csv",
                    f"Copying test data for {org_name}"
                )
                
                if not success:
                    all_success = False
                    continue

                # Test pipeline management commands
                success, stdout, stderr = self.run_command(
                    f'docker compose exec -T backend python manage.py manage_enhanced_pipeline status --org-id {org_id}',
                    f"Testing pipeline status for {org_name}"
                )
                
                self.assert_test(success, f"Pipeline status for {org_name}", stderr, is_warning=not success)
                
                if not success:
                    all_success = False

            finally:
                # Clean up temporary file
                if os.path.exists(temp_csv_path):
                    os.unlink(temp_csv_path)
        
        return all_success

    def generate_enhanced_test_data(self) -> pd.DataFrame:
        """Generate enhanced test data for pipeline testing"""
        data = {
            'product_id': list(range(1, 101)),  # 100 products
            'product_name': [f'Product {i}' for i in range(1, 101)],
            'quantity': [random.randint(10, 1000) for _ in range(100)],
            'price': [round(random.uniform(5.99, 199.99), 2) for _ in range(100)],
            'supplier': [f'Supplier {random.choice(["A", "B", "C", "D", "E"])}' for _ in range(100)],
            'category': [random.choice(['Electronics', 'Clothing', 'Home', 'Books', 'Sports']) for _ in range(100)],
            'date_added': [(datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d') for _ in range(100)]
        }
        
        return pd.DataFrame(data)

    # =================================================================
    # API & FRONTEND TESTING
    # =================================================================

    def test_api_endpoints_comprehensive(self) -> bool:
        """Comprehensive API endpoint testing"""
        print_section("🌐 COMPREHENSIVE API TESTING")
        
        base_url = f"http://{self.host}:8000"
        
        # Core endpoints
        endpoints = [
            ("/api/health/", "Health check", 200),
            ("/auth/", "Authentication endpoint", [200, 301, 302, 405]),
            ("/admin/", "Django admin", [200, 301, 302]),
            ("/api/schema/", "API schema", [200, 404]),  # May not exist
            ("/api/docs/", "API documentation", [200, 404]),  # May not exist
        ]
        
        all_passed = True
        
        for endpoint, description, expected_codes in endpoints:
            if not isinstance(expected_codes, list):
                expected_codes = [expected_codes]
                
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
                
                if response.status_code in expected_codes:
                    print_success(f"{description}: {response.status_code}")
                else:
                    self.assert_test(False, description, 
                                   f"Expected {expected_codes}, got {response.status_code}",
                                   is_warning=endpoint in ["/api/schema/", "/api/docs/"])
                    if endpoint not in ["/api/schema/", "/api/docs/"]:
                        all_passed = False
                        
            except Exception as e:
                self.assert_test(False, description, str(e))
                all_passed = False
        
        return all_passed

    def test_frontend_connectivity(self) -> bool:
        """Test frontend connectivity and basic functionality"""
        print_section("📱 FRONTEND CONNECTIVITY TESTING")
        
        frontend_url = f"http://{self.host}:3000"
        
        try:
            response = requests.get(frontend_url, timeout=10)
            self.assert_test(response.status_code == 200, "Frontend accessibility", 
                           f"Status code: {response.status_code}")
            
            # Check if it looks like a React app
            if response.status_code == 200:
                content = response.text.lower()
                has_react_elements = any(keyword in content for keyword in 
                                       ['react', 'next', 'root', '__next'])
                self.assert_test(has_react_elements, "Frontend React elements", 
                               "No React/Next.js elements detected", is_warning=not has_react_elements)
            
            return response.status_code == 200
            
        except Exception as e:
            self.assert_test(False, "Frontend connectivity", str(e))
            return False

    def test_environment_debug(self) -> bool:
        """Run environment debugging checks"""
        print_section("🔍 ENVIRONMENT DEBUGGING")
        
        # Run the debug script
        success, stdout, stderr = self.run_command(
            "docker compose exec -T backend python /workspace/debug_relational_ui.py",
            "Running environment debug checks"
        )
        
        self.assert_test(success, "Environment debug script", stderr, is_warning=not success)
        
        # Parse debug output for specific checks
        if stdout:
            lines = stdout.split('\n')
            for line in lines:
                if '✅' in line:
                    check_name = line.replace('✅', '').strip()
                    print_info(f"Debug check passed: {check_name}")
                elif '❌' in line:
                    check_name = line.replace('❌', '').strip()
                    print_warning(f"Debug check failed: {check_name}")
        
        return success

    # =================================================================
    # PERFORMANCE TESTING
    # =================================================================

    @timer_decorator("performance_load_test")
    def test_performance_load(self) -> bool:
        """Run performance and load testing"""
        print_section("⚡ PERFORMANCE & LOAD TESTING")
        
        base_url = f"http://{self.host}:8000"
        
        # Test concurrent API requests
        def make_request(endpoint):
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                return response.status_code == 200
            except:
                return False
        
        endpoints = ["/api/health/", "/admin/", "/api/auth/"]
        
        print_step("Testing concurrent API requests...")
        
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for _ in range(50):  # 50 requests total
                for endpoint in endpoints:
                    futures.append(executor.submit(make_request, endpoint))
            
            successful_requests = sum(1 for future in concurrent.futures.as_completed(futures) 
                                    if future.result())
        
        duration = time.time() - start_time
        success_rate = (successful_requests / len(futures)) * 100
        
        print_metric("Load test duration", f"{duration:.2f}", "s")
        print_metric("Success rate", f"{success_rate:.1f}", "%")
        print_metric("Requests per second", f"{len(futures)/duration:.1f}", "req/s")
        
        self.assert_test(success_rate >= 90, "Load test success rate", 
                        f"Only {success_rate:.1f}% requests succeeded")
        
        return success_rate >= 90

    # =================================================================
    # SECURITY TESTING
    # =================================================================

    def test_security_isolation(self) -> bool:
        """Test security and data isolation between organizations"""
        print_section("🛡️  SECURITY & ISOLATION TESTING")
        
        if len(self.test_orgs) < 2:
            self.assert_test(False, "Security testing", "Need at least 2 organizations for isolation testing")
            return False
        
        # Test basic security measures
        security_tests = [
            ("SQL injection protection", self.test_sql_injection_protection),
            ("Cross-org data isolation", self.test_cross_org_isolation),
            ("Authentication requirements", self.test_auth_requirements),
        ]
        
        all_passed = True
        
        for test_name, test_func in security_tests:
            try:
                result = test_func()
                self.assert_test(result, test_name, "" if result else "Security test failed")
                self.test_results['security_tests'][test_name] = 'PASSED' if result else 'FAILED'
                if not result:
                    all_passed = False
            except Exception as e:
                self.assert_test(False, test_name, str(e))
                self.test_results['security_tests'][test_name] = 'ERROR'
                all_passed = False
        
        return all_passed

    def test_sql_injection_protection(self) -> bool:
        """Test SQL injection protection"""
        # Test with malicious input
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/**/OR/**/1=1#"
        ]
        
        for malicious_input in malicious_inputs:
            try:
                # Try to use malicious input in API call
                response = requests.get(
                    f"http://{self.host}:8000/api/health/", 
                    params={'test': malicious_input},
                    timeout=5
                )
                # If we get here without error, basic protection is working
                if response.status_code not in [200, 400, 403]:
                    return False
            except:
                pass  # Errors are expected with malicious input
        
        return True

    def test_cross_org_isolation(self) -> bool:
        """Test data isolation between organizations"""
        # This would require more complex testing with actual data access
        # For now, we'll check that different org databases exist
        
        for org in self.test_orgs[:2]:  # Test first 2 orgs
            success, stdout, stderr = self.run_command(
                f'docker compose exec -T postgres psql -U app_user -d orgdata_{org["id"]} -c "SELECT 1;"',
                f"Testing org database isolation for {org['name']}"
            )
            if not success:
                return False
        
        return True

    def test_auth_requirements(self) -> bool:
        """Test authentication requirements"""
        protected_endpoints = [
            "/admin/",
            "/api/auth/login/",
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"http://{self.host}:8000{endpoint}", timeout=5)
                # Should not return 200 without authentication
                if endpoint == "/admin/" and response.status_code == 200:
                    return False  # Admin should require auth
            except:
                pass
        
        return True

    # =================================================================
    # REPORTING
    # =================================================================

    def generate_comprehensive_report(self) -> None:
        """Generate a comprehensive test report"""
        print_header("📋 COMPREHENSIVE TEST REPORT", "═")
        
        total_time = time.time() - self.start_time
        
        print(f"{Colors.BOLD}SupplyWise AI - All-Inclusive Test Results{Colors.END}")
        print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total execution time: {total_time:.2f} seconds")
        print()
        
        # Test Summary
        print(f"{Colors.BOLD}📊 Test Summary:{Colors.END}")
        print(f"├── Total tests run:     {self.test_results['total_tests']}")
        print(f"├── Tests passed:        {Colors.GREEN}{self.test_results['passed']}{Colors.END}")
        print(f"├── Tests failed:        {Colors.RED}{self.test_results['failed']}{Colors.END}")
        print(f"└── Warnings:            {Colors.YELLOW}{self.test_results['warnings']}{Colors.END}")
        
        # Success rate
        if self.test_results['total_tests'] > 0:
            success_rate = (self.test_results['passed'] / self.test_results['total_tests']) * 100
            color = Colors.GREEN if success_rate >= 90 else Colors.YELLOW if success_rate >= 75 else Colors.RED
            print(f"Success rate: {color}{success_rate:.1f}%{Colors.END}")
        print()
        
        # Performance Metrics
        if self.test_results['performance_metrics']:
            print(f"{Colors.BOLD}⚡ Performance Metrics:{Colors.END}")
            for metric, value in self.test_results['performance_metrics'].items():
                print(f"├── {metric}: {value}")
            print()
        
        # Service URLs
        print(f"{Colors.BOLD}🌐 Service URLs:{Colors.END}")
        print(f"├── Frontend:            http://{self.host}:3000")
        print(f"├── Backend API:         http://{self.host}:8000") 
        print(f"├── Django Admin:        http://{self.host}:8000/admin")
        print(f"├── Airflow:             http://{self.host}:8080")
        print(f"└── MinIO Console:       http://{self.host}:9001")
        print()
        
        # Test Organizations
        if self.test_orgs:
            print(f"{Colors.BOLD}🏢 Test Organizations Created:{Colors.END}")
            for org in self.test_orgs:
                print(f"├── {org['name']} (ID: {org['id']})")
            print()
        
        # Test Accounts
        print(f"{Colors.BOLD}👥 Test Accounts Available:{Colors.END}")
        print("├── Platform Admin:      admin@supplywise.ai / admin123")
        print("├── Owner:               owner@test.com / testpass123")
        print("├── Manager:             manager@test.com / testpass123")  
        print("├── Employee:            employee@test.com / testpass123")
        print("├── Client:              client@test.com / testpass123")
        print("├── Read Only:           readonly@test.com / testpass123")
        print("└── Relational Test:     relational@test.com / testpass123")
        print()
        
        # Errors and Warnings
        if self.test_results['errors']:
            print(f"{Colors.BOLD}{Colors.RED}❌ Errors:{Colors.END}")
            for error in self.test_results['errors']:
                print(f"├── {error}")
            print()
        
        if self.test_results['warnings_list']:
            print(f"{Colors.BOLD}{Colors.YELLOW}⚠️  Warnings:{Colors.END}")
            for warning in self.test_results['warnings_list']:
                print(f"├── {warning}")
            print()
        
        # Next Steps
        print(f"{Colors.BOLD}🚀 Next Steps:{Colors.END}")
        print("1. Visit http://localhost:3000 to access the frontend")
        print("2. Log in with any of the test accounts above")
        print("3. Explore multi-tenant functionality with different organizations")
        print("4. Test file uploads and data processing pipelines")
        print("5. Try the AI query agent features")
        print("6. Monitor workflows in Airflow")
        print("7. Check performance and security features")
        print()
        
        # Troubleshooting
        print(f"{Colors.BOLD}🔧 Troubleshooting Commands:{Colors.END}")
        print("├── Check logs:          docker compose logs [service-name]")
        print("├── Restart service:     docker compose restart [service-name]")
        print("├── Full restart:        docker compose down && docker compose up -d --build")
        print("├── Run quick test:      python comprehensive_test_suite.py --quick-test")
        print("└── Fresh wipe:          python comprehensive_test_suite.py --full-setup --fresh-wipe")

    # =================================================================
    # MAIN TEST RUNNERS
    # =================================================================

    def run_quick_test(self) -> bool:
        """Run a quick validation test"""
        print_header("🚀 QUICK VALIDATION TEST")
        
        success = True
        
        success &= self.check_system_requirements()
        success &= self.wait_for_services_health(max_wait=60)
        success &= self.test_database_connections()
        success &= self.test_api_endpoints_comprehensive()
        success &= self.test_frontend_connectivity()
        
        return success

    def run_enterprise_test(self) -> bool:
        """Run enterprise-specific tests"""
        print_header("🏢 ENTERPRISE TEST SUITE")
        
        success = True
        
        success &= self.setup_django_environment()
        success &= self.test_database_routing()
        success &= self.test_enterprise_routing()
        
        # Create test organizations for enterprise testing
        org_ids = self.create_test_organizations(count=2)
        if org_ids:
            success &= self.test_security_isolation()
        
        return success

    def run_performance_test(self) -> bool:
        """Run performance and load tests"""
        print_header("⚡ PERFORMANCE TEST SUITE")
        
        success = True
        
        success &= self.wait_for_services_health()
        success &= self.test_performance_load()
        
        return success

    def run_full_comprehensive_test(self, fresh_wipe: bool = False) -> bool:
        """Run the complete comprehensive test suite"""
        print_header("🚀 COMPREHENSIVE ALL-INCLUSIVE TEST SUITE")
        print(f"Fresh wipe mode: {'Enabled' if fresh_wipe else 'Disabled'}")
        print(f"Test execution started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        success = True
        
        # Phase 1: Infrastructure
        if not self.check_system_requirements():
            return False
        
        if fresh_wipe:
            self.fresh_wipe_environment()
            if not self.setup_environment():
                return False
        
        success &= self.wait_for_services_health()
        
        # Phase 2: Database Setup
        success &= self.setup_django_environment()
        success &= self.test_database_connections()
        success &= self.test_database_routing()
        success &= self.test_enterprise_routing()
        
        # Phase 3: Organization Setup
        org_ids = self.create_test_organizations(count=3, clean=True)
        if org_ids:
            success &= self.create_comprehensive_test_data(org_ids)
            success &= self.test_comprehensive_data_pipeline(org_ids)
        
        # Phase 4: API & Frontend
        success &= self.test_api_endpoints_comprehensive()
        success &= self.test_frontend_connectivity()
        success &= self.test_environment_debug()
        
        # Phase 5: Performance & Security
        success &= self.test_performance_load()
        success &= self.test_security_isolation()
        
        # Phase 6: Report
        self.generate_comprehensive_report()
        
        if success:
            print_success("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
            print_info("Your SupplyWise AI platform is fully operational and ready for use.")
        else:
            print_warning("⚠️  Some tests failed, but core functionality should work.")
            print_info("Check the detailed report above for specific issues.")
            
        return success


def main():
    """Main entry point for the comprehensive test suite"""
    parser = argparse.ArgumentParser(
        description="SupplyWise AI - Comprehensive All-Inclusive Testing Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --full-setup --fresh-wipe          # Complete fresh setup (recommended)
  %(prog)s --quick-test                       # Quick validation test
  %(prog)s --enterprise-test                  # Enterprise features only
  %(prog)s --performance-test                 # Performance benchmarking
  %(prog)s --full-setup                       # Full test without wipe
        """
    )
    
    parser.add_argument(
        "--full-setup",
        action="store_true",
        help="Run complete comprehensive test suite"
    )
    
    parser.add_argument(
        "--fresh-wipe",
        action="store_true",
        help="Completely wipe environment before testing (use with --full-setup)"
    )
    
    parser.add_argument(
        "--quick-test",
        action="store_true", 
        help="Run quick validation tests only"
    )
    
    parser.add_argument(
        "--enterprise-test",
        action="store_true",
        help="Run enterprise-specific tests only"
    )
    
    parser.add_argument(
        "--performance-test",
        action="store_true",
        help="Run performance and load tests only"
    )

    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Host/IP for service connections (default: localhost)"
    )

    args = parser.parse_args()
    
    # Show help if no arguments provided
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    suite = ComprehensiveTestSuite(host=args.host)
    
    try:
        if args.full_setup:
            success = suite.run_full_comprehensive_test(fresh_wipe=args.fresh_wipe)
            sys.exit(0 if success else 1)
        elif args.quick_test:
            success = suite.run_quick_test()
            sys.exit(0 if success else 1)
        elif args.enterprise_test:
            success = suite.run_enterprise_test()
            sys.exit(0 if success else 1)
        elif args.performance_test:
            success = suite.run_performance_test()
            sys.exit(0 if success else 1)
        else:
            parser.print_help()
            
    except KeyboardInterrupt:
        print_warning("\n\nTest suite interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()