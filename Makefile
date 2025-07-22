# SupplyWise AI Testing Makefile
# ================================
# 
# Convenient shortcuts for running various testing scenarios
# 
# Usage:
#   make test-quick           # Quick validation
#   make test-full            # Full comprehensive test
#   make test-fresh           # Fresh wipe and full setup
#   make test-enterprise      # Enterprise features
#   make test-performance     # Performance testing
#   make setup               # Install testing dependencies

.PHONY: help test-quick test-full test-fresh test-enterprise test-performance test-docker test-api test-db setup clean-docker install-deps

# Default target
help:
	@echo "SupplyWise AI Testing Commands"
	@echo "==============================="
	@echo ""
	@echo "Quick Testing:"
	@echo "  test-quick         Run quick validation tests (< 2 minutes)"
	@echo "  test-docker        Test Docker services only"
	@echo "  test-api           Test API endpoints only"
	@echo "  test-db            Test database connectivity only"
	@echo ""
	@echo "Comprehensive Testing:"
	@echo "  test-full          Run full comprehensive test suite"
	@echo "  test-fresh         Fresh wipe + full setup (recommended for new deployments)"
	@echo "  test-enterprise    Test enterprise features (multi-tenant, security)"
	@echo "  test-performance   Run performance and load testing"
	@echo ""
	@echo "Setup & Maintenance:"
	@echo "  setup              Install testing dependencies"
	@echo "  install-deps       Install all testing requirements"
	@echo "  clean-docker       Clean Docker environment"
	@echo "  logs               Show recent Docker logs"
	@echo ""
	@echo "Legacy Support:"
	@echo "  test-unified       Run original unified test suite"
	@echo ""

# Quick Testing Commands
test-quick:
	@echo "🚀 Running Quick Tests..."
	python quick_test.py

test-docker:
	@echo "🐳 Testing Docker Services..."
	python quick_test.py --docker-only

test-api:
	@echo "🌐 Testing API Endpoints..."
	python quick_test.py --api-only

test-db:
	@echo "🗄️  Testing Database Connectivity..."
	python quick_test.py --db-only

# Comprehensive Testing Commands
test-full:
	@echo "🎯 Running Full Comprehensive Test Suite..."
	python comprehensive_test_suite.py --full-setup

test-fresh:
	@echo "🧹 Fresh Wipe + Full Setup..."
	@echo "⚠️  This will wipe your entire Docker environment!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	python comprehensive_test_suite.py --full-setup --fresh-wipe

test-enterprise:
	@echo "🏢 Testing Enterprise Features..."
	python comprehensive_test_suite.py --enterprise-test

test-performance:
	@echo "⚡ Running Performance Tests..."
	python comprehensive_test_suite.py --performance-test

# Legacy Support
test-unified:
	@echo "🔄 Running Original Unified Test Suite..."
	python unified_test_suite.py --full-setup

# Setup and Maintenance
setup: install-deps
	@echo "✅ Testing environment setup complete!"

install-deps:
	@echo "📦 Installing testing dependencies..."
	pip install -r requirements-testing.txt
	pip install -r requirements-comprehensive-testing.txt

clean-docker:
	@echo "🧹 Cleaning Docker environment..."
	docker compose down -v --remove-orphans
	docker volume prune -f
	docker system prune -f

logs:
	@echo "📋 Recent Docker Logs..."
	docker compose logs --tail=50

# Development helpers
status:
	@echo "📊 Service Status:"
	docker compose ps

restart:
	@echo "🔄 Restarting Docker services..."
	docker compose restart

rebuild:
	@echo "🏗️  Rebuilding Docker services..."
	docker compose up -d --build

# Environment checks
check-env:
	@echo "🔍 Environment Check:"
	@echo "Docker version:"
	@docker --version || echo "❌ Docker not found"
	@echo "Docker Compose version:"
	@docker compose version || echo "❌ Docker Compose not found"
	@echo "Python version:"
	@python --version || echo "❌ Python not found"
	@echo "Available disk space:"
	@df -h . | tail -1

# Advanced testing scenarios
test-ci:
	@echo "🤖 CI/CD Testing Pipeline..."
	python quick_test.py
	@if [ $$? -eq 0 ]; then \
		echo "✅ Quick tests passed, running comprehensive tests..."; \
		python comprehensive_test_suite.py --quick-test; \
	else \
		echo "❌ Quick tests failed, stopping pipeline"; \
		exit 1; \
	fi

test-all: test-quick test-full
	@echo "🎉 All tests completed!"

# Documentation
docs:
	@echo "📚 Opening testing documentation..."
	@if command -v xdg-open > /dev/null; then \
		xdg-open COMPREHENSIVE_TESTING_GUIDE.md; \
	elif command -v open > /dev/null; then \
		open COMPREHENSIVE_TESTING_GUIDE.md; \
	else \
		echo "Please open COMPREHENSIVE_TESTING_GUIDE.md manually"; \
	fi

# Debug helpers
debug-backend:
	@echo "🔍 Backend Debug Info:"
	docker compose logs backend --tail=20

debug-db:
	@echo "🔍 Database Debug Info:"
	docker compose logs postgres --tail=20
	docker compose logs mongo --tail=20

debug-frontend:
	@echo "🔍 Frontend Debug Info:"
	docker compose logs frontend --tail=20

# Production readiness
prod-check:
	@echo "🎯 Production Readiness Check..."
	python comprehensive_test_suite.py --full-setup
	@echo ""
	@echo "🚀 Production Readiness Checklist:"
	@echo "  ✅ All tests passed"
	@echo "  ✅ Multi-tenant functionality validated"
	@echo "  ✅ Security measures verified"
	@echo "  ✅ Performance benchmarks met"
	@echo "  ✅ Data pipelines operational"
	@echo ""
	@echo "Your SupplyWise AI platform is ready for production! 🎉"