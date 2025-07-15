from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Organization, CustomUser
from allauth.account.models import EmailAddress
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from datetime import datetime, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create comprehensive test data for relational-ui tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Organization ID to create data for (will use/create test org if not provided)',
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing test data first',
        )

    def handle(self, *args, **options):
        org_id = options.get('org_id')
        
        # Get or create organization
        if org_id:
            try:
                org = Organization.objects.get(id=org_id)
                self.stdout.write(f'Using organization: {org.name} (ID: {org.id})')
            except Organization.DoesNotExist:
                self.stdout.write(f'Organization with ID {org_id} not found!')
                return
        else:
            org, created = Organization.objects.get_or_create(
                name='Test Organization - Relational UI',
                defaults={'slug': 'test-org-relational-ui'}
            )
            if created:
                self.stdout.write(f'Created organization: {org.name} (ID: {org.id})')
            else:
                self.stdout.write(f'Using existing organization: {org.name} (ID: {org.id})')

        # Ensure we have a test user for this org
        test_user, user_created = CustomUser.objects.get_or_create(
            email='relational@test.com',
            defaults={
                'username': 'relational_test',
                'first_name': 'Relational',
                'last_name': 'Test',
                'role': 'owner',
                'org': org,
            }
        )
        
        if user_created:
            test_user.set_password('testpass123')
            test_user.save()
            self.stdout.write(f'Created test user: {test_user.email}')
        
        # Ensure email is verified
        EmailAddress.objects.update_or_create(
            user=test_user,
            email=test_user.email,
            defaults={'verified': True, 'primary': True}
        )

        # Get organization database connection
        org_db_name = f"orgdata_{org.id}"
        connection = self.get_org_db_connection(org_db_name)
        
        if not connection:
            self.stdout.write(f'Failed to connect to organization database: {org_db_name}')
            return

        try:
            cursor = connection.cursor(cursor_factory=RealDictCursor)
            
            if options['clean']:
                self.stdout.write('Cleaning existing test data...')
                self.clean_test_data(cursor)
            
            # Create tables if they don't exist
            self.create_tables_if_not_exist(cursor)
            
            # Generate test data
            self.stdout.write('Creating test data...')
            
            # Create suppliers
            suppliers = self.create_suppliers(cursor)
            self.stdout.write(f'✅ Created {len(suppliers)} suppliers')
            
            # Create warehouses
            warehouses = self.create_warehouses(cursor)
            self.stdout.write(f'✅ Created {len(warehouses)} warehouses')
            
            # Create customers
            customers = self.create_customers(cursor)
            self.stdout.write(f'✅ Created {len(customers)} customers')
            
            # Create products
            products = self.create_products(cursor, suppliers)
            self.stdout.write(f'✅ Created {len(products)} products')
            
            # Create inventory
            inventory_items = self.create_inventory(cursor, products, warehouses)
            self.stdout.write(f'✅ Created {len(inventory_items)} inventory items')
            
            # Create orders
            orders = self.create_orders(cursor, customers)
            self.stdout.write(f'✅ Created {len(orders)} orders')
            
            # Create shipments
            shipments = self.create_shipments(cursor, orders)
            self.stdout.write(f'✅ Created {len(shipments)} shipments')
            
            connection.commit()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n🎉 Test data setup complete!\n'
                    f'Organization: {org.name} (ID: {org.id})\n'
                    f'Database: {org_db_name}\n'
                    f'Test user: relational@test.com (password: testpass123)\n'
                    f'\nYou can now test the relational-ui page with populated data!'
                )
            )
            
        except Exception as e:
            connection.rollback()
            self.stdout.write(f'❌ Error creating test data: {e}')
            raise
        finally:
            connection.close()

    def get_org_db_connection(self, db_name):
        """Get connection to organization-specific database"""
        try:
            return psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', 5432),
                database=db_name,
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'postgres')
            )
        except psycopg2.OperationalError as e:
            self.stdout.write(f'Database connection failed: {e}')
            self.stdout.write(f'Make sure the database {db_name} exists and is accessible')
            return None

    def clean_test_data(self, cursor):
        """Clean existing test data"""
        tables = ['shipments', 'inventory', 'products', 'orders', 'customers', 'warehouses', 'suppliers']
        for table in tables:
            try:
                cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")
            except psycopg2.Error:
                pass  # Table might not exist

    def create_tables_if_not_exist(self, cursor):
        """Create tables if they don't exist"""
        
        # Suppliers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Warehouses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS warehouses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                location TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Customers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Products table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2),
                stock_quantity INTEGER DEFAULT 0,
                supplier INTEGER REFERENCES suppliers(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Inventory table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                product INTEGER REFERENCES products(id),
                warehouse INTEGER REFERENCES warehouses(id),
                quantity INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer INTEGER REFERENCES customers(id),
                order_date DATE NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                total_amount DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Shipments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shipments (
                id SERIAL PRIMARY KEY,
                "order" INTEGER REFERENCES orders(id),
                tracking_number VARCHAR(255),
                carrier VARCHAR(255),
                shipped_date DATE,
                delivered_date DATE,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

    def create_suppliers(self, cursor):
        """Create sample suppliers"""
        suppliers = [
            ('TechCorp Solutions', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
            ('Global Electronics', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', '456 Innovation Blvd, Austin, TX'),
            ('Parts & Components Inc', 'Mike Chen', 'mike@partscomponents.com', '+1-555-0103', '789 Industrial Ave, Detroit, MI'),
            ('Quality Materials Ltd', 'Emma Davis', 'emma@qualitymat.com', '+1-555-0104', '321 Supply Chain Dr, Chicago, IL'),
            ('Reliable Suppliers Co', 'David Wilson', 'david@reliablesuppliers.com', '+1-555-0105', '654 Distribution Way, Phoenix, AZ'),
        ]
        
        supplier_ids = []
        for name, contact, email, phone, address in suppliers:
            cursor.execute("""
                INSERT INTO suppliers (name, contact_name, email, phone, address)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """, (name, contact, email, phone, address))
            supplier_ids.append(cursor.fetchone()['id'])
        
        return supplier_ids

    def create_warehouses(self, cursor):
        """Create sample warehouses"""
        warehouses = [
            ('West Coast Distribution Center', 'Los Angeles, CA'),
            ('East Coast Fulfillment Hub', 'Atlanta, GA'),
            ('Central Processing Facility', 'Dallas, TX'),
            ('Northern Regional Warehouse', 'Chicago, IL'),
            ('Southern Distribution Point', 'Miami, FL'),
        ]
        
        warehouse_ids = []
        for name, location in warehouses:
            cursor.execute("""
                INSERT INTO warehouses (name, location)
                VALUES (%s, %s)
                RETURNING id;
            """, (name, location))
            warehouse_ids.append(cursor.fetchone()['id'])
        
        return warehouse_ids

    def create_customers(self, cursor):
        """Create sample customers"""
        customers = [
            ('Acme Corporation', 'orders@acme.com', '+1-555-0201', '100 Business Plaza, New York, NY'),
            ('Beta Industries', 'purchasing@beta.com', '+1-555-0202', '200 Corporate Ave, San Francisco, CA'),
            ('Gamma Solutions', 'procurement@gamma.com', '+1-555-0203', '300 Enterprise Blvd, Seattle, WA'),
            ('Delta Technologies', 'buying@delta.com', '+1-555-0204', '400 Innovation Circle, Boston, MA'),
            ('Epsilon Services', 'orders@epsilon.com', '+1-555-0205', '500 Service Road, Denver, CO'),
            ('Zeta Manufacturing', 'supply@zeta.com', '+1-555-0206', '600 Factory Lane, Portland, OR'),
            ('Eta Retail Chain', 'procurement@eta.com', '+1-555-0207', '700 Retail Row, Las Vegas, NV'),
            ('Theta Logistics', 'purchasing@theta.com', '+1-555-0208', '800 Transport Way, Houston, TX'),
        ]
        
        customer_ids = []
        for name, email, phone, address in customers:
            cursor.execute("""
                INSERT INTO customers (name, email, phone, address)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (name, email, phone, address))
            customer_ids.append(cursor.fetchone()['id'])
        
        return customer_ids

    def create_products(self, cursor, supplier_ids):
        """Create sample products"""
        products = [
            ('Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 99.99, 150),
            ('Smartphone Charging Cable', 'USB-C to USB-A charging cable, 6 feet', 19.99, 500),
            ('Laptop Computer Stand', 'Adjustable aluminum laptop stand for better ergonomics', 49.99, 75),
            ('Wireless Computer Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 200),
            ('External Hard Drive 1TB', 'Portable external storage device with USB 3.0', 79.99, 120),
            ('Webcam HD 1080p', 'High-definition webcam for video conferencing', 59.99, 90),
            ('Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard', 129.99, 60),
            ('Portable Power Bank', '20,000mAh portable battery charger', 39.99, 180),
            ('Bluetooth Speaker', 'Waterproof portable Bluetooth speaker', 69.99, 110),
            ('Tablet Screen Protector', 'Tempered glass screen protector for tablets', 14.99, 300),
            ('USB Flash Drive 64GB', 'High-speed USB 3.0 flash drive', 24.99, 250),
            ('Wireless Earbuds', 'True wireless earbuds with charging case', 89.99, 95),
        ]
        
        product_ids = []
        for name, description, price, stock in products:
            supplier_id = random.choice(supplier_ids)
            cursor.execute("""
                INSERT INTO products (name, description, price, stock_quantity, supplier)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """, (name, description, price, stock, supplier_id))
            product_ids.append(cursor.fetchone()['id'])
        
        return product_ids

    def create_inventory(self, cursor, product_ids, warehouse_ids):
        """Create inventory records"""
        inventory_ids = []
        
        for product_id in product_ids:
            # Each product is stored in 2-3 random warehouses
            num_warehouses = random.randint(2, 3)
            selected_warehouses = random.sample(warehouse_ids, num_warehouses)
            
            for warehouse_id in selected_warehouses:
                quantity = random.randint(10, 100)
                cursor.execute("""
                    INSERT INTO inventory (product, warehouse, quantity)
                    VALUES (%s, %s, %s)
                    RETURNING id;
                """, (product_id, warehouse_id, quantity))
                inventory_ids.append(cursor.fetchone()['id'])
        
        return inventory_ids

    def create_orders(self, cursor, customer_ids):
        """Create sample orders"""
        statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        order_ids = []
        
        # Create orders for the last 30 days
        for i in range(25):  # 25 orders
            customer_id = random.choice(customer_ids)
            order_date = (datetime.now() - timedelta(days=random.randint(0, 30))).date()
            status = random.choice(statuses)
            total_amount = round(random.uniform(50.0, 500.0), 2)
            
            cursor.execute("""
                INSERT INTO orders (customer, order_date, status, total_amount)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (customer_id, order_date, status, total_amount))
            order_ids.append(cursor.fetchone()['id'])
        
        return order_ids

    def create_shipments(self, cursor, order_ids):
        """Create shipments for orders"""
        carriers = ['UPS', 'FedEx', 'DHL', 'USPS', 'Amazon Logistics']
        statuses = ['pending', 'shipped', 'in_transit', 'delivered']
        shipment_ids = []
        
        # Create shipments for 80% of orders
        orders_to_ship = random.sample(order_ids, int(len(order_ids) * 0.8))
        
        for order_id in orders_to_ship:
            carrier = random.choice(carriers)
            status = random.choice(statuses)
            tracking_number = f"{carrier[:3].upper()}{random.randint(100000000, 999999999)}"
            
            # Set dates based on status
            shipped_date = None
            delivered_date = None
            
            if status in ['shipped', 'in_transit', 'delivered']:
                shipped_date = (datetime.now() - timedelta(days=random.randint(0, 10))).date()
                
                if status == 'delivered':
                    delivered_date = shipped_date + timedelta(days=random.randint(1, 5))
            
            cursor.execute("""
                INSERT INTO shipments ("order", tracking_number, carrier, shipped_date, delivered_date, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (order_id, tracking_number, carrier, shipped_date, delivered_date, status))
            shipment_ids.append(cursor.fetchone()['id'])
        
        return shipment_ids