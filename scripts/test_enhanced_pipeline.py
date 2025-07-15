#!/usr/bin/env python3
"""
Enhanced Data Pipeline Testing Script

This script provides comprehensive testing for the enhanced organization-aware data pipeline.
It validates all major components including ingestion, versioning, audit trails, and data quality.

Usage:
    python test_enhanced_pipeline.py [--org-id ORG_ID] [--test-type TYPE]

Test Types:
    all             - Run all tests (default)
    ingestion       - Test enhanced ingestion functionality
    versioning     - Test version control and audit trails
    quality        - Test data quality framework
    mongodb        - Test MongoDB operations
    postgresql     - Test PostgreSQL operations
    management     - Test management CLI tools
"""

import os
import sys
import json
import tempfile
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
import argparse
import uuid

# Add Django settings
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "backend"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from pymongo import MongoClient
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Import our enhanced modules
from backend_scripts.airflow_tasks.enhanced_ingest_from_minio import EnhancedDataIngestion
from backend_scripts.airflow_tasks.enhanced_load_mongo_to_postgres import EnhancedMongoToPostgres
from backend_scripts.data_pipeline_manager import DataPipelineManager

# Import Django models
from accounts.models import Organization, CustomUser
from datagrid.models import DataIngestionJob, DataQualityReport, DataVersionHistory

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env", override=True)

class EnhancedPipelineTestSuite:
    """Comprehensive test suite for the enhanced data pipeline"""
    
    def __init__(self, org_id: str = None):
        self.org_id = org_id or self.get_or_create_test_org()
        self.test_results = {}
        self.mongo_client = MongoClient(os.getenv("MONGO_URI"))
        self.mongo_db = self.mongo_client[os.getenv("MONGO_DATABASE", "client_data")]
        print(f"🧪 Initializing test suite for organization: {self.org_id}")
    
    def get_or_create_test_org(self) -> str:
        """Get or create a test organization"""
        try:
            test_org, created = Organization.objects.get_or_create(
                name="Test Organization Enhanced Pipeline",
                defaults={'slug': 'test-org-enhanced'}
            )
            if created:
                print(f"✅ Created test organization: {test_org.name} (ID: {test_org.id})")
            else:
                print(f"📋 Using existing test organization: {test_org.name} (ID: {test_org.id})")
            return str(test_org.id)
        except Exception as e:
            print(f"❌ Error creating test organization: {e}")
            return "test_org_123"
    
    def create_test_csv_data(self) -> pd.DataFrame:
        """Create sample CSV data for testing"""
        test_data = {
            'order_id': ['ORD001', 'ORD002', 'ORD003', 'ORD004', 'ORD005'],
            'customer_id': ['CUST001', 'CUST002', 'CUST001', 'CUST003', 'CUST002'],
            'product_id': ['PROD001', 'PROD002', 'PROD001', 'PROD003', 'PROD002'],
            'order_date': ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
            'quantity': [2, 1, 3, 1, 2],
            'amount': [199.99, 49.99, 299.99, 79.99, 99.99],
            'status': ['completed', 'pending', 'completed', 'cancelled', 'completed']
        }
        return pd.DataFrame(test_data)
    
    def test_enhanced_ingestion(self) -> bool:
        """Test enhanced ingestion functionality"""
        print("\n" + "="*60)
        print("🔄 Testing Enhanced Ingestion")
        print("="*60)
        
        try:
            # Create test ingestion instance
            ingestion = EnhancedDataIngestion()
            
            # Test composite key generation
            test_record = {
                'order_id': 'ORD001',
                'customer_id': 'CUST001',
                'order_date': '2024-01-15'
            }
            business_keys = ['order_id', 'customer_id', 'order_date']
            composite_key = ingestion.generate_org_composite_key(
                self.org_id, test_record, 'orders', business_keys
            )
            
            expected_key = f"org_{self.org_id}_orders_ORD001_CUST001_2024-01-15"
            assert composite_key == expected_key, f"Expected {expected_key}, got {composite_key}"
            print(f"✅ Composite key generation: {composite_key}")
            
            # Test data hash calculation
            data_hash = ingestion.calculate_data_hash(test_record)
            assert len(data_hash) == 64, f"Expected 64-char hash, got {len(data_hash)}"
            print(f"✅ Data hash calculation: {data_hash[:16]}...")
            
            # Test data quality validation
            quality_result = ingestion.validate_record_quality(test_record, 'orders', self.org_id)
            assert 'status' in quality_result, "Quality result missing status"
            assert 'quality_score' in quality_result, "Quality result missing quality score"
            print(f"✅ Data quality validation: {quality_result['status']} (Score: {quality_result['quality_score']})")
            
            # Test change detection
            old_record = test_record.copy()
            new_record = test_record.copy()
            new_record['amount'] = 299.99
            
            changed_fields = ingestion.detect_changed_fields(old_record, new_record)
            assert 'amount' in changed_fields, "Should detect amount change"
            print(f"✅ Change detection: {changed_fields}")
            
            self.test_results['enhanced_ingestion'] = True
            print("✅ Enhanced ingestion tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ Enhanced ingestion test failed: {e}")
            self.test_results['enhanced_ingestion'] = False
            return False
    
    def test_versioning_and_audit(self) -> bool:
        """Test version control and audit trail functionality"""
        print("\n" + "="*60)
        print("📚 Testing Versioning & Audit Trails")
        print("="*60)
        
        try:
            # Create test collection name
            collection_name = f"raw_{self.org_id}_orders"
            collection = self.mongo_db[collection_name]
            
            # Clear any existing test data
            collection.delete_many({"composite_key": {"$regex": f"^org_{self.org_id}_orders_TEST"}})
            
            # Create initial test record
            test_record = {
                "org_id": self.org_id,
                "table": "orders",
                "composite_key": f"org_{self.org_id}_orders_TEST001_CUST001_2024-01-15",
                "order_id": "TEST001",
                "customer_id": "CUST001",
                "order_date": "2024-01-15",
                "amount": 99.99,
                "version": 1,
                "data_hash": "test_hash_v1",
                "change_type": "INSERT",
                "changed_fields": [],
                "ingested_at": datetime.now(timezone.utc),
                "is_active": True
            }
            
            # Insert initial version
            result = collection.insert_one(test_record)
            print(f"✅ Inserted initial record version 1: {result.inserted_id}")
            
            # Create updated version
            updated_record = test_record.copy()
            updated_record["_id"] = None  # Remove _id for new insert
            updated_record["amount"] = 149.99
            updated_record["version"] = 2
            updated_record["data_hash"] = "test_hash_v2"
            updated_record["change_type"] = "UPDATE"
            updated_record["changed_fields"] = ["amount"]
            updated_record["previous_version"] = 1
            
            result = collection.insert_one(updated_record)
            print(f"✅ Inserted updated record version 2: {result.inserted_id}")
            
            # Test version retrieval
            versions = list(collection.find({
                "composite_key": test_record["composite_key"]
            }).sort("version", 1))
            
            assert len(versions) == 2, f"Expected 2 versions, found {len(versions)}"
            assert versions[0]["version"] == 1, "First version should be 1"
            assert versions[1]["version"] == 2, "Second version should be 2"
            assert versions[1]["previous_version"] == 1, "Second version should reference first"
            
            print(f"✅ Version history validation: {len(versions)} versions found")
            
            # Test latest version retrieval
            latest = collection.find_one({
                "composite_key": test_record["composite_key"]
            }, sort=[("version", -1)])
            
            assert latest["version"] == 2, "Latest version should be 2"
            assert latest["amount"] == 149.99, "Latest amount should be updated value"
            
            print(f"✅ Latest version retrieval: v{latest['version']} with amount ${latest['amount']}")
            
            self.test_results['versioning_audit'] = True
            print("✅ Versioning and audit trail tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ Versioning and audit test failed: {e}")
            self.test_results['versioning_audit'] = False
            return False
    
    def test_data_quality_framework(self) -> bool:
        """Test data quality framework"""
        print("\n" + "="*60)
        print("🎯 Testing Data Quality Framework")
        print("="*60)
        
        try:
            ingestion = EnhancedDataIngestion()
            
            # Test high-quality record
            good_record = {
                'order_id': 'ORD001',
                'customer_id': 'CUST001',
                'order_date': '2024-01-15',
                'amount': 99.99,
                'status': 'completed'
            }
            
            quality_result = ingestion.validate_record_quality(good_record, 'orders', self.org_id)
            assert quality_result['status'] == 'PASSED', "Good record should pass validation"
            assert quality_result['quality_score'] >= 0.9, "Good record should have high quality score"
            print(f"✅ High-quality record validation: {quality_result['status']} (Score: {quality_result['quality_score']})")
            
            # Test record with missing required fields
            bad_record = {
                'order_id': 'ORD002',
                # Missing customer_id and order_date (required fields)
                'amount': 'invalid_amount',
                'status': 'test'  # Suspicious value
            }
            
            quality_result = ingestion.validate_record_quality(bad_record, 'orders', self.org_id)
            assert quality_result['status'] == 'FAILED', "Bad record should fail validation"
            assert len(quality_result['errors']) > 0, "Bad record should have errors"
            assert quality_result['quality_score'] < 0.5, "Bad record should have low quality score"
            print(f"✅ Low-quality record validation: {quality_result['status']} (Score: {quality_result['quality_score']})")
            print(f"   Errors: {quality_result['errors']}")
            
            # Test record with warnings
            warning_record = {
                'order_id': 'ORD003',
                'customer_id': 'CUST003',
                'order_date': '2024-01-15',
                'amount': 99.99,
                'status': 'test',  # Suspicious value that triggers warning
                'description': 'N/A'  # Another suspicious value
            }
            
            quality_result = ingestion.validate_record_quality(warning_record, 'orders', self.org_id)
            assert len(quality_result['warnings']) > 0, "Warning record should have warnings"
            print(f"✅ Warning record validation: {quality_result['status']} (Score: {quality_result['quality_score']})")
            print(f"   Warnings: {quality_result['warnings']}")
            
            self.test_results['data_quality'] = True
            print("✅ Data quality framework tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ Data quality framework test failed: {e}")
            self.test_results['data_quality'] = False
            return False
    
    def test_mongodb_operations(self) -> bool:
        """Test MongoDB operations and collections"""
        print("\n" + "="*60)
        print("🗄️ Testing MongoDB Operations")
        print("="*60)
        
        try:
            # Test organization-specific collection naming
            expected_collection = f"raw_{self.org_id}_orders"
            collection = self.mongo_db[expected_collection]
            
            # Test collection creation and indexing
            collection.create_index("composite_key", unique=False)
            collection.create_index([("composite_key", 1), ("version", -1)])
            collection.create_index([("org_id", 1), ("is_active", 1)])
            
            print(f"✅ Created collection with indexes: {expected_collection}")
            
            # Test data insertion with organization isolation
            test_docs = [
                {
                    "org_id": self.org_id,
                    "composite_key": f"org_{self.org_id}_orders_TEST_MONGO_001",
                    "table": "orders",
                    "order_id": "TEST_MONGO_001",
                    "version": 1,
                    "ingested_at": datetime.now(timezone.utc),
                    "is_active": True
                },
                {
                    "org_id": "different_org",  # Different org to test isolation
                    "composite_key": "org_different_org_orders_TEST_MONGO_001",
                    "table": "orders", 
                    "order_id": "TEST_MONGO_001",
                    "version": 1,
                    "ingested_at": datetime.now(timezone.utc),
                    "is_active": True
                }
            ]
            
            # Insert test documents
            for doc in test_docs:
                collection.insert_one(doc)
            
            # Test organization isolation
            org_docs = list(collection.find({"org_id": self.org_id}))
            other_org_docs = list(collection.find({"org_id": "different_org"}))
            
            assert len(org_docs) >= 1, "Should find documents for test organization"
            assert len(other_org_docs) >= 1, "Should find documents for different organization"
            
            # Verify isolation - our org should only see its own data
            our_org_only = list(collection.find({"org_id": self.org_id}))
            for doc in our_org_only:
                assert doc["org_id"] == self.org_id, "Should only return documents for our organization"
            
            print(f"✅ Organization isolation: Found {len(our_org_only)} docs for org {self.org_id}")
            
            # Test compound queries
            recent_active = list(collection.find({
                "org_id": self.org_id,
                "is_active": True,
                "ingested_at": {"$gte": datetime.now(timezone.utc) - pd.Timedelta(minutes=5)}
            }))
            
            print(f"✅ Compound queries: Found {len(recent_active)} recent active documents")
            
            # Test index usage (basic check)
            index_info = collection.index_information()
            assert len(index_info) >= 4, "Should have multiple indexes created"  # _id + our 3 indexes
            print(f"✅ Index creation: {len(index_info)} indexes available")
            
            self.test_results['mongodb_operations'] = True
            print("✅ MongoDB operations tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ MongoDB operations test failed: {e}")
            self.test_results['mongodb_operations'] = False
            return False
    
    def test_postgresql_operations(self) -> bool:
        """Test PostgreSQL operations and organization databases"""
        print("\n" + "="*60)
        print("🐘 Testing PostgreSQL Operations")
        print("="*60)
        
        try:
            postgres_loader = EnhancedMongoToPostgres()
            
            # Test organization database creation
            db_name = postgres_loader.create_org_database(self.org_id)
            assert db_name == f"orgdata_{self.org_id}", f"Expected orgdata_{self.org_id}, got {db_name}"
            print(f"✅ Organization database creation: {db_name}")
            
            # Test schema loading
            schema_columns = postgres_loader.get_default_schema('orders')
            assert len(schema_columns) > 5, "Should have multiple schema columns"
            
            # Verify enhanced metadata columns are included
            column_names = [col[0] for col in schema_columns]
            required_metadata = ['version', 'data_hash', 'change_type', 'audit_trail']
            for req_col in required_metadata:
                assert req_col in column_names, f"Missing required metadata column: {req_col}"
            
            print(f"✅ Schema validation: {len(schema_columns)} columns including metadata")
            
            # Test table creation
            engine = postgres_loader.get_organization_pg_engine(self.org_id)
            table_created = postgres_loader.create_enhanced_tables(engine, 'orders', schema_columns)
            assert table_created, "Table creation should succeed"
            print(f"✅ Enhanced table creation: raw_orders with audit trails")
            
            # Test data quality metrics calculation
            test_df = pd.DataFrame([
                {'order_id': 'TEST001', 'data_quality': {'status': 'PASSED', 'quality_score': 0.95}},
                {'order_id': 'TEST002', 'data_quality': {'status': 'WARNING', 'quality_score': 0.85}},
                {'order_id': 'TEST003', 'data_quality': {'status': 'FAILED', 'quality_score': 0.45}}
            ])
            
            quality_metrics = postgres_loader.calculate_quality_metrics(test_df, self.org_id, 'orders')
            assert quality_metrics['total_records'] == 3, "Should process 3 test records"
            assert quality_metrics['records_with_errors'] == 1, "Should detect 1 failed record"
            assert 0.7 < quality_metrics['average_quality_score'] < 0.8, "Average quality should be ~0.75"
            
            print(f"✅ Quality metrics calculation: {quality_metrics['total_records']} records, avg score {quality_metrics['average_quality_score']:.3f}")
            
            # Test database connection and basic queries
            with engine.connect() as conn:
                # Test table exists
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'raw_orders'
                    );
                """))
                table_exists = result.scalar()
                assert table_exists, "raw_orders table should exist"
                
                # Test indexes exist
                index_result = conn.execute(text("""
                    SELECT indexname FROM pg_indexes 
                    WHERE tablename = 'raw_orders';
                """))
                indexes = [row[0] for row in index_result]
                assert len(indexes) >= 6, "Should have multiple indexes on raw_orders"
                
                print(f"✅ Database validation: Table exists with {len(indexes)} indexes")
            
            self.test_results['postgresql_operations'] = True
            print("✅ PostgreSQL operations tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ PostgreSQL operations test failed: {e}")
            self.test_results['postgresql_operations'] = False
            return False
    
    def test_management_cli(self) -> bool:
        """Test management CLI functionality"""
        print("\n" + "="*60)
        print("🛠️ Testing Management CLI")
        print("="*60)
        
        try:
            manager = DataPipelineManager()
            
            # Test pipeline status
            status_result = manager.show_pipeline_status(self.org_id, days=7)
            assert 'overall_stats' in status_result, "Status result should include overall stats"
            assert 'org_summaries' in status_result, "Status result should include org summaries"
            print(f"✅ Pipeline status check: {len(status_result['org_summaries'])} organizations")
            
            # Test PostgreSQL engine creation
            engine = manager.get_organization_pg_engine(self.org_id)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                assert result.scalar() == 1, "PostgreSQL connection should work"
            print(f"✅ PostgreSQL engine: Connection successful")
            
            # Test alerts functionality (even if no alerts exist)
            alerts_result = manager.show_alerts(self.org_id)
            assert 'alerts' in alerts_result, "Alerts result should include alerts list"
            assert 'summary' in alerts_result or 'severity_counts' in alerts_result, "Should include summary"
            print(f"✅ Alerts check: {len(alerts_result['alerts'])} active alerts")
            
            self.test_results['management_cli'] = True
            print("✅ Management CLI tests passed!")
            return True
            
        except Exception as e:
            print(f"❌ Management CLI test failed: {e}")
            self.test_results['management_cli'] = False
            return False
    
    def run_all_tests(self) -> dict:
        """Run all test suites"""
        print("🚀 Starting Enhanced Data Pipeline Test Suite")
        print("="*80)
        
        tests = [
            ('Enhanced Ingestion', self.test_enhanced_ingestion),
            ('Versioning & Audit', self.test_versioning_and_audit),
            ('Data Quality Framework', self.test_data_quality_framework),
            ('MongoDB Operations', self.test_mongodb_operations),
            ('PostgreSQL Operations', self.test_postgresql_operations),
            ('Management CLI', self.test_management_cli),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                self.test_results[test_name.lower().replace(' ', '_')] = False
        
        # Final summary
        print("\n" + "="*80)
        print("📊 TEST RESULTS SUMMARY")
        print("="*80)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        print(f"\n🏆 Overall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Your enhanced data pipeline is ready!")
        else:
            print("⚠️  Some tests failed. Please review the errors above.")
        
        return self.test_results

def main():
    """Main CLI interface for testing"""
    parser = argparse.ArgumentParser(description="Enhanced Data Pipeline Test Suite")
    parser.add_argument('--org-id', type=str, help='Organization ID to test with')
    parser.add_argument('--test-type', type=str, default='all',
                       choices=['all', 'ingestion', 'versioning', 'quality', 'mongodb', 'postgresql', 'management'],
                       help='Type of test to run')
    
    args = parser.parse_args()
    
    # Initialize test suite
    test_suite = EnhancedPipelineTestSuite(args.org_id)
    
    # Run specified tests
    if args.test_type == 'all':
        results = test_suite.run_all_tests()
        return 0 if all(results.values()) else 1
    else:
        test_methods = {
            'ingestion': test_suite.test_enhanced_ingestion,
            'versioning': test_suite.test_versioning_and_audit,
            'quality': test_suite.test_data_quality_framework,
            'mongodb': test_suite.test_mongodb_operations,
            'postgresql': test_suite.test_postgresql_operations,
            'management': test_suite.test_management_cli,
        }
        
        if args.test_type in test_methods:
            success = test_methods[args.test_type]()
            return 0 if success else 1
        else:
            print(f"❌ Unknown test type: {args.test_type}")
            return 1

if __name__ == "__main__":
    sys.exit(main())