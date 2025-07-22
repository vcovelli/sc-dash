#!/usr/bin/env python3
"""
Quick Test Runner for SupplyWise AI
===================================

A lightweight, fast test runner for quick validation of the SupplyWise AI platform.
Perfect for development workflows and CI/CD pipelines.

Usage:
    python quick_test.py [OPTIONS]

Examples:
    python quick_test.py                    # Run all quick tests
    python quick_test.py --docker-only      # Test Docker services only
    python quick_test.py --api-only         # Test API endpoints only
    python quick_test.py --db-only          # Test database connectivity only
"""

import sys
import argparse
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent))

from testing_utils import (
    DockerManager, DatabaseManager, APITester, SecurityTester,
    PerformanceMonitor, ReportGenerator, Logger
)


class QuickTestRunner:
    """Lightweight test runner for fast validation"""
    
    def __init__(self, host: str = "localhost"):
        self.host = host
        self.docker_manager = DockerManager()
        self.api_tester = APITester(f"http://{host}:8000")
        self.security_tester = SecurityTester()
        self.performance_monitor = PerformanceMonitor()
        self.report = ReportGenerator()
    
    def test_docker_services(self) -> bool:
        """Test Docker services health"""
        Logger.section("🐳 Docker Services Test")
        
        # Check Docker availability
        docker_available = self.docker_manager.check_docker_available()
        self.report.add_test_result("Docker availability", docker_available)
        
        if not docker_available:
            return False
        
        # Check service status
        service_status = self.docker_manager.get_service_status()
        
        # Test critical services
        critical_services = ['postgres', 'backend']
        all_critical_healthy = True
        
        for service in critical_services:
            if service in service_status:
                is_running = service_status[service]
                self.report.add_test_result(f"{service} service running", is_running)
                
                if is_running:
                    # Test health endpoint
                    is_healthy = self.docker_manager.wait_for_service_health(
                        service, self.host, max_wait=30
                    )
                    self.report.add_test_result(f"{service} health check", is_healthy)
                    if not is_healthy:
                        all_critical_healthy = False
                else:
                    all_critical_healthy = False
            else:
                self.report.add_test_result(f"{service} service found", False)
                all_critical_healthy = False
        
        # Test optional services (warnings only)
        optional_services = ['frontend', 'mongo', 'redis']
        for service in optional_services:
            if service in service_status:
                is_running = service_status[service]
                self.report.add_test_result(f"{service} service running", is_running, 
                                          is_warning=not is_running)
                
                if is_running:
                    is_healthy = self.docker_manager.wait_for_service_health(
                        service, self.host, max_wait=15
                    )
                    self.report.add_test_result(f"{service} health check", is_healthy,
                                              is_warning=not is_healthy)
        
        return all_critical_healthy
    
    def test_database_connectivity(self) -> bool:
        """Test database connections"""
        Logger.section("🗄️  Database Connectivity Test")
        
        self.performance_monitor.start_timer("database_connectivity")
        
        db_results = DatabaseManager.test_database_connectivity()
        
        # PostgreSQL is critical
        pg_success = db_results.get('postgresql', False)
        self.report.add_test_result("PostgreSQL connection", pg_success)
        
        # MongoDB is optional for some features
        mongo_success = db_results.get('mongodb', False)
        self.report.add_test_result("MongoDB connection", mongo_success, 
                                  is_warning=not mongo_success)
        
        self.performance_monitor.stop_timer("database_connectivity")
        
        return pg_success  # Only require PostgreSQL for quick test
    
    def test_api_endpoints(self) -> bool:
        """Test critical API endpoints"""
        Logger.section("🌐 API Endpoints Test")
        
        self.performance_monitor.start_timer("api_testing")
        
        # Define critical endpoints
        endpoints = [
            ("/api/health/", "GET", 200),
            ("/admin/", "GET", [200, 301, 302]),  # May redirect to login
            ("/api/auth/", "GET", [200, 301, 302, 405]),  # May not allow GET
        ]
        
        all_passed = True
        
        for endpoint, method, expected_codes in endpoints:
            if not isinstance(expected_codes, list):
                expected_codes = [expected_codes]
            
            success = False
            try:
                import requests
                response = requests.get(f"http://{self.host}:8000{endpoint}", timeout=10)
                success = response.status_code in expected_codes
                
                if success:
                    Logger.success(f"{method} {endpoint}: {response.status_code}")
                else:
                    Logger.error(f"{method} {endpoint}: Expected {expected_codes}, got {response.status_code}")
                    
            except Exception as e:
                Logger.error(f"{method} {endpoint}: {str(e)}")
            
            self.report.add_test_result(f"API {endpoint}", success)
            if not success:
                all_passed = False
        
        self.performance_monitor.stop_timer("api_testing")
        
        return all_passed
    
    def test_frontend_connectivity(self) -> bool:
        """Test frontend connectivity"""
        Logger.section("📱 Frontend Connectivity Test")
        
        try:
            import requests
            response = requests.get(f"http://{self.host}:3000", timeout=10)
            success = response.status_code == 200
            
            self.report.add_test_result("Frontend accessibility", success,
                                      f"Status: {response.status_code}" if not success else "")
            
            # Check for React/Next.js indicators
            if success:
                content = response.text.lower()
                has_react = any(keyword in content for keyword in 
                               ['react', 'next', 'root', '__next'])
                self.report.add_test_result("Frontend React detection", has_react,
                                          is_warning=not has_react)
            
            return success
            
        except Exception as e:
            self.report.add_test_result("Frontend accessibility", False, str(e))
            return False
    
    def test_basic_security(self) -> bool:
        """Test basic security measures"""
        Logger.section("🛡️  Basic Security Test")
        
        self.performance_monitor.start_timer("security_testing")
        
        # Test SQL injection protection
        sql_protection = self.security_tester.test_sql_injection_protection(
            f"http://{self.host}:8000"
        )
        self.report.add_test_result("SQL injection protection", sql_protection)
        
        # Test XSS protection
        xss_protection = self.security_tester.test_xss_protection(
            f"http://{self.host}:8000"
        )
        self.report.add_test_result("XSS protection", xss_protection)
        
        self.performance_monitor.stop_timer("security_testing")
        
        return sql_protection and xss_protection
    
    def run_performance_check(self) -> bool:
        """Run basic performance checks"""
        Logger.section("⚡ Performance Check")
        
        self.performance_monitor.start_timer("performance_check")
        
        import time
        import requests
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        # Test concurrent requests
        def make_request():
            try:
                response = requests.get(f"http://{self.host}:8000/api/health/", timeout=5)
                return response.status_code == 200
            except:
                return False
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            successful_requests = sum(1 for future in as_completed(futures) if future.result())
        
        duration = time.time() - start_time
        success_rate = (successful_requests / 20) * 100
        
        Logger.metric("Concurrent requests", f"{successful_requests}/20")
        Logger.metric("Success rate", f"{success_rate:.1f}", "%")
        Logger.metric("Duration", f"{duration:.2f}", "s")
        Logger.metric("Requests per second", f"{20/duration:.1f}", "req/s")
        
        # Record metrics
        self.performance_monitor.record_metric("concurrent_success_rate", f"{success_rate:.1f}%")
        self.performance_monitor.record_metric("requests_per_second", f"{20/duration:.1f}")
        
        self.performance_monitor.stop_timer("performance_check")
        
        # Consider success if >90% of requests succeed
        performance_ok = success_rate >= 90
        self.report.add_test_result("Performance load test", performance_ok,
                                  f"Success rate: {success_rate:.1f}%")
        
        return performance_ok
    
    def run_all_tests(self) -> bool:
        """Run all quick tests"""
        Logger.header("🚀 Quick Test Suite for SupplyWise AI")
        
        all_passed = True
        
        # Run test suites
        if not self.test_docker_services():
            Logger.error("Docker services test failed - stopping")
            return False
        
        all_passed &= self.test_database_connectivity()
        all_passed &= self.test_api_endpoints()
        all_passed &= self.test_frontend_connectivity()
        all_passed &= self.test_basic_security()
        all_passed &= self.run_performance_check()
        
        return all_passed
    
    def run_docker_only(self) -> bool:
        """Run Docker tests only"""
        Logger.header("🐳 Docker Services Quick Test")
        return self.test_docker_services()
    
    def run_api_only(self) -> bool:
        """Run API tests only"""
        Logger.header("🌐 API Quick Test")
        return self.test_api_endpoints()
    
    def run_db_only(self) -> bool:
        """Run database tests only"""
        Logger.header("🗄️  Database Quick Test")
        return self.test_database_connectivity()
    
    def generate_report(self):
        """Generate final test report"""
        # Add performance metrics to report
        self.report.add_metrics(self.performance_monitor.get_metrics())
        
        # Generate summary
        self.report.generate_summary_report()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Quick Test Runner for SupplyWise AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Run all quick tests
  %(prog)s --docker-only      # Test Docker services only
  %(prog)s --api-only         # Test API endpoints only
  %(prog)s --db-only          # Test database connectivity only
        """
    )
    
    parser.add_argument(
        "--docker-only",
        action="store_true",
        help="Test Docker services only"
    )
    
    parser.add_argument(
        "--api-only",
        action="store_true", 
        help="Test API endpoints only"
    )
    
    parser.add_argument(
        "--db-only",
        action="store_true",
        help="Test database connectivity only"
    )
    
    parser.add_argument(
        "--host",
        type=str,
        default="localhost",
        help="Host for service connections (default: localhost)"
    )
    
    args = parser.parse_args()
    
    # Create test runner
    runner = QuickTestRunner(host=args.host)
    
    try:
        # Run specific test or all tests
        if args.docker_only:
            success = runner.run_docker_only()
        elif args.api_only:
            success = runner.run_api_only()
        elif args.db_only:
            success = runner.run_db_only()
        else:
            success = runner.run_all_tests()
        
        # Generate report
        runner.generate_report()
        
        # Exit with appropriate code
        if success:
            Logger.success("🎉 All quick tests passed!")
        else:
            Logger.warning("⚠️  Some quick tests failed. Check the report above.")
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        Logger.warning("\nQuick test interrupted by user")
        sys.exit(1)
    except Exception as e:
        Logger.error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()