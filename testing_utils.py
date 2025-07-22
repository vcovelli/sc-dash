#!/usr/bin/env python3
"""
Testing Utilities for SupplyWise AI
====================================

Common utilities and helper functions used across all testing scripts.
This module provides reusable components for:
- Docker management
- Database operations
- Test data generation
- Performance monitoring
- Logging and reporting

Usage:
    from testing_utils import DockerManager, TestDataGenerator, PerformanceMonitor
"""

import os
import sys
import time
import subprocess
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import pymongo
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import json
import random
import string


class Colors:
    """ANSI color codes for beautiful terminal output"""
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


class Logger:
    """Enhanced logging utilities with color support"""
    
    @staticmethod
    def header(text: str, char: str = "=", width: int = 70):
        """Print a formatted header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{char * width}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}{text.center(width)}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{char * width}{Colors.END}")

    @staticmethod
    def section(text: str):
        """Print a section header"""
        print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'─' * 50}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.WHITE}{text}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.MAGENTA}{'─' * 50}{Colors.END}")

    @staticmethod
    def success(text: str):
        """Print success message"""
        print(f"{Colors.GREEN}✅ {text}{Colors.END}")

    @staticmethod
    def warning(text: str):
        """Print warning message"""  
        print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

    @staticmethod
    def error(text: str):
        """Print error message"""
        print(f"{Colors.RED}❌ {text}{Colors.END}")

    @staticmethod
    def info(text: str):
        """Print info message"""
        print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

    @staticmethod
    def step(text: str):
        """Print step message"""
        print(f"{Colors.CYAN}🔄 {text}{Colors.END}")

    @staticmethod
    def metric(name: str, value: str, unit: str = ""):
        """Print performance metric"""
        print(f"{Colors.MAGENTA}📊 {name}: {Colors.BOLD}{value}{unit}{Colors.END}")


class CommandRunner:
    """Enhanced command runner with better error handling and logging"""
    
    @staticmethod
    def run(command: str, description: str, capture_output: bool = True, 
            cwd: Optional[str] = None, check: bool = True, 
            timeout: int = 300) -> Tuple[bool, str, str]:
        """Run a command and return success status and output"""
        Logger.step(description)
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=capture_output,
                text=True, 
                cwd=cwd,
                check=check,
                timeout=timeout
            )
            if result.stdout and not capture_output:
                print(result.stdout)
            return True, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            error_msg = f"Command timed out after {timeout} seconds"
            Logger.error(error_msg)
            return False, "", error_msg
        except subprocess.CalledProcessError as e:
            error_msg = f"Command failed (exit code {e.returncode})"
            if e.stdout:
                error_msg += f"\nOutput: {e.stdout}"
            if e.stderr:
                error_msg += f"\nError: {e.stderr}"
            Logger.error(error_msg)
            return False, e.stdout or "", e.stderr or ""


class DockerManager:
    """Docker management utilities"""
    
    def __init__(self):
        self.services = {
            'postgres': {'port': 5432, 'health_path': None},
            'mongo': {'port': 27017, 'health_path': None},
            'backend': {'port': 8000, 'health_path': '/api/health/'},
            'frontend': {'port': 3000, 'health_path': '/'},
            'airflow-webserver': {'port': 8080, 'health_path': '/health'},
            'minio': {'port': 9000, 'health_path': '/minio/health/live'},
            'redis': {'port': 6379, 'health_path': None},
        }
    
    def check_docker_available(self) -> bool:
        """Check if Docker is available and running"""
        success, _, _ = CommandRunner.run("docker --version", "Checking Docker installation")
        if not success:
            return False
        
        success, _, _ = CommandRunner.run("docker ps", "Checking Docker daemon")
        return success
    
    def get_service_status(self) -> Dict[str, bool]:
        """Get status of all Docker Compose services"""
        success, stdout, _ = CommandRunner.run(
            "docker compose ps --format json", 
            "Getting service status"
        )
        
        if not success:
            return {}
        
        service_status = {}
        try:
            for line in stdout.strip().split('\n'):
                if line.strip():
                    service_data = json.loads(line)
                    name = service_data.get('Service', service_data.get('Name', 'unknown'))
                    state = service_data.get('State', 'unknown')
                    service_status[name] = state == 'running'
        except json.JSONDecodeError:
            Logger.warning("Could not parse service status JSON")
            
        return service_status
    
    def wait_for_service_health(self, service_name: str, host: str = "localhost", 
                              max_wait: int = 60) -> bool:
        """Wait for a service to become healthy"""
        if service_name not in self.services:
            Logger.warning(f"Unknown service: {service_name}")
            return False
            
        service = self.services[service_name]
        port = service['port']
        health_path = service.get('health_path')
        
        Logger.step(f"Waiting for {service_name} to become healthy (max {max_wait}s)...")
        
        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                if health_path:
                    response = requests.get(f"http://{host}:{port}{health_path}", timeout=5)
                    if response.status_code == 200:
                        Logger.success(f"{service_name} is healthy")
                        return True
                else:
                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((host, port))
                    sock.close()
                    if result == 0:
                        Logger.success(f"{service_name} is responding on port {port}")
                        return True
                        
            except Exception:
                pass
                
            time.sleep(2)
            
        Logger.error(f"{service_name} did not become healthy within {max_wait} seconds")
        return False
    
    def restart_service(self, service_name: str) -> bool:
        """Restart a specific service"""
        success, _, stderr = CommandRunner.run(
            f"docker compose restart {service_name}",
            f"Restarting {service_name}"
        )
        return success
    
    def get_service_logs(self, service_name: str, lines: int = 50) -> str:
        """Get logs for a specific service"""
        success, stdout, _ = CommandRunner.run(
            f"docker compose logs --tail={lines} {service_name}",
            f"Getting logs for {service_name}"
        )
        return stdout if success else ""


class DatabaseManager:
    """Database management utilities"""
    
    @staticmethod
    def get_postgres_connection(database: str = "supplywise", 
                              host: str = "localhost", port: int = 5432,
                              user: str = None, password: str = None):
        """Get PostgreSQL connection"""
        user = user or os.getenv('APP_DB_USER', 'app_user')
        password = password or os.getenv('APP_DB_PASSWORD', 'app_pass')
        
        try:
            return psycopg2.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password
            )
        except psycopg2.OperationalError as e:
            Logger.error(f"PostgreSQL connection failed: {e}")
            return None
    
    @staticmethod
    def get_mongo_connection(host: str = "localhost", port: int = 27017):
        """Get MongoDB connection"""
        try:
            client = pymongo.MongoClient(f"mongodb://{host}:{port}/")
            # Test connection
            client.admin.command('ping')
            return client
        except pymongo.errors.ConnectionFailure as e:
            Logger.error(f"MongoDB connection failed: {e}")
            return None
    
    @staticmethod
    def test_database_connectivity() -> Dict[str, bool]:
        """Test connectivity to all databases"""
        results = {}
        
        # Test PostgreSQL
        pg_conn = DatabaseManager.get_postgres_connection()
        results['postgresql'] = pg_conn is not None
        if pg_conn:
            pg_conn.close()
        
        # Test MongoDB
        mongo_client = DatabaseManager.get_mongo_connection()
        results['mongodb'] = mongo_client is not None
        if mongo_client:
            mongo_client.close()
        
        return results


class TestDataGenerator:
    """Generate realistic test data for various testing scenarios"""
    
    @staticmethod
    def generate_user_data(count: int = 10) -> List[Dict]:
        """Generate user test data"""
        users = []
        roles = ['owner', 'manager', 'employee', 'client', 'read_only']
        
        for i in range(count):
            user = {
                'email': f'testuser{i+1}@example.com',
                'username': f'testuser{i+1}',
                'first_name': f'Test{i+1}',
                'last_name': 'User',
                'role': random.choice(roles),
                'password': 'testpass123'
            }
            users.append(user)
        
        return users
    
    @staticmethod
    def generate_product_data(count: int = 50) -> pd.DataFrame:
        """Generate product test data"""
        categories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Automotive']
        suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E']
        
        data = {
            'product_id': list(range(1, count + 1)),
            'product_name': [f'Product {i}' for i in range(1, count + 1)],
            'description': [f'Description for product {i}' for i in range(1, count + 1)],
            'category': [random.choice(categories) for _ in range(count)],
            'price': [round(random.uniform(5.99, 999.99), 2) for _ in range(count)],
            'stock_quantity': [random.randint(0, 500) for _ in range(count)],
            'supplier': [random.choice(suppliers) for _ in range(count)],
            'created_date': [
                (datetime.now() - timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d')
                for _ in range(count)
            ]
        }
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_order_data(count: int = 100) -> pd.DataFrame:
        """Generate order test data"""
        statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        
        data = {
            'order_id': list(range(1, count + 1)),
            'customer_id': [random.randint(1, 20) for _ in range(count)],
            'order_date': [
                (datetime.now() - timedelta(days=random.randint(0, 90))).strftime('%Y-%m-%d')
                for _ in range(count)
            ],
            'status': [random.choice(statuses) for _ in range(count)],
            'total_amount': [round(random.uniform(10.00, 1000.00), 2) for _ in range(count)],
            'items_count': [random.randint(1, 10) for _ in range(count)]
        }
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_csv_test_file(data: pd.DataFrame, filename: str = None) -> str:
        """Generate a CSV test file from DataFrame"""
        if filename is None:
            filename = f"test_data_{int(time.time())}.csv"
        
        filepath = Path("/tmp") / filename
        data.to_csv(filepath, index=False)
        return str(filepath)


class PerformanceMonitor:
    """Monitor and measure performance during testing"""
    
    def __init__(self):
        self.metrics = {}
        self.start_times = {}
    
    def start_timer(self, name: str):
        """Start timing an operation"""
        self.start_times[name] = time.time()
    
    def stop_timer(self, name: str) -> float:
        """Stop timing an operation and return duration"""
        if name not in self.start_times:
            Logger.warning(f"Timer '{name}' was not started")
            return 0.0
        
        duration = time.time() - self.start_times[name]
        self.metrics[name] = duration
        del self.start_times[name]
        return duration
    
    def record_metric(self, name: str, value: Any):
        """Record a custom metric"""
        self.metrics[name] = value
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all recorded metrics"""
        return self.metrics.copy()
    
    def print_metrics_report(self):
        """Print a formatted metrics report"""
        if not self.metrics:
            Logger.info("No metrics recorded")
            return
        
        Logger.section("Performance Metrics Report")
        for name, value in self.metrics.items():
            if isinstance(value, float):
                Logger.metric(name, f"{value:.2f}", "s")
            else:
                Logger.metric(name, str(value))


class APITester:
    """API testing utilities"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def test_endpoint(self, endpoint: str, method: str = "GET", 
                     expected_status: int = 200, **kwargs) -> bool:
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = getattr(self.session, method.lower())(url, timeout=10, **kwargs)
            success = response.status_code == expected_status
            
            if success:
                Logger.success(f"{method} {endpoint}: {response.status_code}")
            else:
                Logger.error(f"{method} {endpoint}: Expected {expected_status}, got {response.status_code}")
            
            return success
            
        except Exception as e:
            Logger.error(f"{method} {endpoint}: {str(e)}")
            return False
    
    def test_endpoints_batch(self, endpoints: List[Tuple[str, str, int]]) -> Dict[str, bool]:
        """Test multiple endpoints"""
        results = {}
        
        for endpoint, method, expected_status in endpoints:
            results[f"{method} {endpoint}"] = self.test_endpoint(endpoint, method, expected_status)
        
        return results


class SecurityTester:
    """Security testing utilities"""
    
    @staticmethod
    def test_sql_injection_protection(base_url: str) -> bool:
        """Test basic SQL injection protection"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/**/OR/**/1=1#",
            "' UNION SELECT * FROM users--"
        ]
        
        for malicious_input in malicious_inputs:
            try:
                response = requests.get(
                    f"{base_url}/api/health/", 
                    params={'test': malicious_input},
                    timeout=5
                )
                # If we get here without 500 error, basic protection is working
                if response.status_code == 500:
                    Logger.error(f"SQL injection vulnerability detected with input: {malicious_input}")
                    return False
            except Exception:
                # Errors are expected with malicious input
                pass
        
        Logger.success("SQL injection protection tests passed")
        return True
    
    @staticmethod
    def test_xss_protection(base_url: str) -> bool:
        """Test basic XSS protection"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ]
        
        for payload in xss_payloads:
            try:
                response = requests.get(
                    f"{base_url}/api/health/", 
                    params={'test': payload},
                    timeout=5
                )
                # Check if payload is reflected unescaped
                if payload in response.text:
                    Logger.error(f"XSS vulnerability detected with payload: {payload}")
                    return False
            except Exception:
                pass
        
        Logger.success("XSS protection tests passed")
        return True


class ReportGenerator:
    """Generate comprehensive test reports"""
    
    def __init__(self):
        self.test_results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'errors': [],
            'warnings_list': [],
            'metrics': {},
            'start_time': datetime.now()
        }
    
    def add_test_result(self, test_name: str, passed: bool, 
                       details: str = "", is_warning: bool = False):
        """Add a test result"""
        self.test_results['total_tests'] += 1
        
        if passed:
            self.test_results['passed'] += 1
            Logger.success(test_name)
        elif is_warning:
            self.test_results['warnings'] += 1
            self.test_results['warnings_list'].append(f"{test_name}: {details}")
            Logger.warning(f"{test_name} - {details}")
        else:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {details}")
            Logger.error(f"{test_name} - {details}")
    
    def add_metrics(self, metrics: Dict[str, Any]):
        """Add performance metrics"""
        self.test_results['metrics'].update(metrics)
    
    def generate_summary_report(self):
        """Generate and print a summary report"""
        Logger.header("Test Summary Report")
        
        total_time = datetime.now() - self.test_results['start_time']
        
        print(f"Execution time: {total_time.total_seconds():.2f} seconds")
        print(f"Total tests: {self.test_results['total_tests']}")
        print(f"Passed: {Colors.GREEN}{self.test_results['passed']}{Colors.END}")
        print(f"Failed: {Colors.RED}{self.test_results['failed']}{Colors.END}")
        print(f"Warnings: {Colors.YELLOW}{self.test_results['warnings']}{Colors.END}")
        
        if self.test_results['total_tests'] > 0:
            success_rate = (self.test_results['passed'] / self.test_results['total_tests']) * 100
            color = Colors.GREEN if success_rate >= 90 else Colors.YELLOW if success_rate >= 75 else Colors.RED
            print(f"Success rate: {color}{success_rate:.1f}%{Colors.END}")
        
        if self.test_results['errors']:
            print(f"\n{Colors.RED}Errors:{Colors.END}")
            for error in self.test_results['errors']:
                print(f"  • {error}")
        
        if self.test_results['warnings_list']:
            print(f"\n{Colors.YELLOW}Warnings:{Colors.END}")
            for warning in self.test_results['warnings_list']:
                print(f"  • {warning}")
        
        if self.test_results['metrics']:
            print(f"\n{Colors.MAGENTA}Performance Metrics:{Colors.END}")
            for name, value in self.test_results['metrics'].items():
                print(f"  • {name}: {value}")


# Convenience functions for backward compatibility
def print_header(text: str, char: str = "="):
    Logger.header(text, char)

def print_section(text: str):
    Logger.section(text)

def print_success(text: str):
    Logger.success(text)

def print_warning(text: str):
    Logger.warning(text)

def print_error(text: str):
    Logger.error(text)

def print_info(text: str):
    Logger.info(text)

def print_step(text: str):
    Logger.step(text)

def print_metric(name: str, value: str, unit: str = ""):
    Logger.metric(name, value, unit)