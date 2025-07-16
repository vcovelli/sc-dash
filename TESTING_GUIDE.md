# 🚀 SupplyWise AI - Unified Testing Guide

## Overview

The **Unified Test Suite** (`unified_test_suite.py`) is your one-stop solution for testing and setting up the SupplyWise AI platform. This script consolidates all testing functionality into a single, well-documented tool that makes it easy to validate your entire application stack.

## 🎯 What It Does

### Complete Platform Validation
- ✅ **Docker Environment**: Validates all containers are running and healthy
- ✅ **Database Connectivity**: Tests PostgreSQL and MongoDB connections
- ✅ **Multi-Tenant Setup**: Creates organizations with proper database routing
- ✅ **RBAC System**: Sets up users with different roles and permissions
- ✅ **Sample Data**: Generates realistic test data (suppliers, products, orders, etc.)
- ✅ **Data Pipeline**: Tests MongoDB → PostgreSQL data flow
- ✅ **API Endpoints**: Validates critical API functionality
- ✅ **End-to-End Testing**: Comprehensive functionality validation

### Test Data Generated
- **Organizations**: Multi-tenant structure with proper isolation
- **Users**: All role types (Owner, Manager, Employee, Client, Read-Only, Platform Admin)
- **Supply Chain Data**: Suppliers, warehouses, products, customers
- **Transactions**: Orders, order items, inventory records
- **Logistics**: Shipments with realistic tracking data
- **Analytics Data**: Ready for dashboard and reporting features

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Docker is running
docker --version
docker compose --version

# Start the platform
docker compose up -d --build
```

### Install Testing Dependencies
```bash
pip install -r requirements-testing.txt
```

### Full Setup (Recommended)
```bash
# Complete setup with default test organization
python unified_test_suite.py --full-setup

# Setup with custom organization name
python unified_test_suite.py --full-setup --org-name "My Test Company"

# Clean existing data and start fresh
python unified_test_suite.py --full-setup --clean
```

## 📋 Usage Options

### Complete Testing Suite
```bash
python unified_test_suite.py --full-setup
```
**What it does:**
1. Validates Docker environment
2. Checks service health
3. Runs Django migrations
4. Creates test organization with proper database routing
5. Sets up RBAC users with different permission levels
6. Generates comprehensive sample data
7. Tests data pipeline functionality
8. Validates API endpoints
9. Provides detailed test report with login credentials

### Health Checks Only
```bash
python unified_test_suite.py --health-check
```
**Perfect for:**
- Troubleshooting startup issues
- Validating service configuration
- Quick environment validation

### Data Pipeline Testing
```bash
python unified_test_suite.py --test-pipeline --org-id 123
```
**Tests:**
- MongoDB connectivity and operations
- PostgreSQL data loading
- Enhanced pipeline management
- Data transformation processes

### Custom Organization Setup
```bash
python unified_test_suite.py --full-setup --org-name "Custom Org Name"
```

### Clean Installation
```bash
python unified_test_suite.py --full-setup --clean
```
**Use when:**
- Starting fresh after development changes
- Clearing corrupted test data
- Resetting to known good state

## 🔐 Test Accounts Created

After running the full setup, you'll have these accounts ready:

| Email | Role | Password | Capabilities |
|-------|------|----------|-------------|
| `admin@supplywise.ai` | Platform Admin | `admin123` | Access to all organizations |
| `owner@test.com` | Owner | `testpass123` | Full organization management |
| `manager@test.com` | Manager | `testpass123` | User invites, analytics access |
| `employee@test.com` | Employee | `testpass123` | Analytics and data access |
| `client@test.com` | Client | `testpass123` | Limited dashboard access |
| `readonly@test.com` | Read Only | `testpass123` | View-only access |

## 🌐 Service URLs

After successful setup, access these services:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **Airflow**: http://localhost:8080
- **MinIO Console**: http://localhost:9001

## 📊 Sample Data Details

### Organizations
- Multi-tenant structure with proper data isolation
- Database routing configured for each organization
- Audit trails and activity logging enabled

### Supply Chain Data
- **8 Suppliers**: Global Electronics, Pacific Manufacturing, European Textiles, etc.
- **4 Warehouses**: Distribution centers across different regions
- **50 Products**: Electronics, industrial equipment, raw materials, etc.
- **25 Customers**: Business clients with realistic contact information
- **100 Orders**: Mix of pending, shipped, delivered, and cancelled orders
- **Inventory Records**: Stock levels across warehouses
- **Shipments**: Tracking data with realistic delivery timelines

### Analytics Ready
All data is structured for immediate use in:
- Executive dashboards
- Supply chain analytics
- Demand forecasting models
- Performance reporting
- Data visualization components

## 🔧 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check service logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]

# Full restart
docker compose down && docker compose up -d --build
```

**Health checks failing:**
```bash
# Run just health checks
python unified_test_suite.py --health-check

# Check individual service status
docker compose ps
```

**Database connection issues:**
```bash
# Test database connectivity
python unified_test_suite.py --test-pipeline

# Check database logs
docker compose logs postgres
docker compose logs mongo
```

**Permission issues:**
```bash
# Make script executable
chmod +x unified_test_suite.py

# Run with clean flag to reset permissions
python unified_test_suite.py --full-setup --clean
```

### Script Options Help
```bash
python unified_test_suite.py --help
```

## 🧪 Development Testing Workflow

### Initial Setup
```bash
# First time setup
docker compose up -d --build
python unified_test_suite.py --full-setup
```

### After Code Changes
```bash
# Rebuild and test
docker compose up -d --build
python unified_test_suite.py --health-check
```

### Testing New Features
```bash
# Fresh environment for testing
python unified_test_suite.py --full-setup --clean
```

### CI/CD Integration
```bash
# Automated testing (exits with error code on failure)
python unified_test_suite.py --full-setup --org-name "CI-Test-Org"
```

## 📈 Understanding Test Results

### Success Indicators
- ✅ Green checkmarks indicate successful operations
- 🎉 Final success message confirms all tests passed
- Complete test report with all service URLs and credentials

### Warning Indicators
- ⚠️ Yellow warnings indicate non-critical issues
- System may function with reduced capabilities
- Review specific warnings for optimization opportunities

### Error Indicators
- ❌ Red errors indicate critical failures
- System may not function properly
- Address errors before proceeding with development

## 🔄 Data Pipeline Testing Details

The script tests your complete data pipeline:

1. **CSV Ingestion**: Creates and processes test CSV files
2. **MongoDB Operations**: Tests document storage and retrieval
3. **PostgreSQL Loading**: Validates relational data transformation
4. **Schema Mapping**: Tests dynamic schema handling
5. **Data Quality**: Validates data integrity and consistency
6. **Audit Trails**: Tests versioning and change tracking

## 🚀 Next Steps After Testing

1. **Explore the Frontend**: Visit http://localhost:3000
2. **Test Authentication**: Log in with different role accounts
3. **Upload Data**: Test file upload and processing features
4. **View Analytics**: Explore dashboards and visualizations
5. **Test AI Features**: Try the natural language query agent
6. **Monitor Workflows**: Check Airflow for data pipeline status
7. **Review Logs**: Monitor application logs for any issues

## 🏗️ Architecture Validation

The unified test suite validates your entire architecture:

- **Frontend**: Next.js application with TypeScript
- **Backend**: Django REST API with multi-tenant support
- **Databases**: PostgreSQL (relational) + MongoDB (document)
- **Caching**: Redis for session and application caching
- **Workflows**: Apache Airflow for data pipeline orchestration
- **Storage**: MinIO for object storage and file handling
- **Containerization**: Docker and Docker Compose

## 📝 Logging and Monitoring

Test execution is fully logged with:
- Color-coded output for easy reading
- Detailed error messages with troubleshooting hints
- Performance timing for each test phase
- Comprehensive final report with all credentials and URLs

This unified approach ensures you have a fully functional, properly tested SupplyWise AI platform ready for development and demonstration.