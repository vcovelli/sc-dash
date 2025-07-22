import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import Organization, CustomUser
from api.models import Supplier, Warehouse, Product, Customer, Order, OrderItem, Inventory, Shipment
from config.routers import set_org_context, clear_org_context
from config.db_utils import ensure_org_database

class Command(BaseCommand):
    help = 'Create realistic supply chain sample data for testing and demos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org',
            type=str,
            default='Demo Supply Co',
            help='Organization name to create data for',
        )
        parser.add_argument(
            '--suppliers',
            type=int,
            default=8,
            help='Number of suppliers to create',
        )
        parser.add_argument(
            '--warehouses',
            type=int,
            default=4,
            help='Number of warehouses to create',
        )
        parser.add_argument(
            '--products',
            type=int,
            default=50,
            help='Number of products to create',
        )
        parser.add_argument(
            '--customers',
            type=int,
            default=25,
            help='Number of customers to create',
        )
        parser.add_argument(
            '--orders',
            type=int,
            default=100,
            help='Number of orders to create',
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing data for this org first',
        )

    def handle(self, *args, **options):
        self.org_name = options['org']

        # Always get/create using default DB (safe for central table)
        org_obj, created = Organization.objects.using('default').get_or_create(
            name=self.org_name,
            defaults={'slug': self.org_name.lower().replace(' ', '-')}
        )

        # 🔧 Ensure org DB exists and migrations applied
        ensure_org_database(org_obj.id)

        # ✅ Set routing context *before* using routed DB
        set_org_context(org_obj.id)

        # Re-fetch from routed DB to use in ForeignKey relations
        self.org = Organization.objects.using(f"orgdata_{org_obj.id}").get(id=org_obj.id)
        try:
            if options['clean']:
                self.clean_existing_data()

            self.stdout.write('🏗️  Creating sample supply chain data...')

            suppliers = self.create_suppliers(options['suppliers'])
            warehouses = self.create_warehouses(options['warehouses'])
            products = self.create_products(options['products'], suppliers)
            customers = self.create_customers(options['customers'])

            self.create_inventory(products, warehouses)

            orders = self.create_orders(options['orders'], customers, products)
            self.create_shipments(orders, warehouses)

            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Sample data created successfully!\n'
                    f'Organization: {self.org.name}\n'
                    f'Suppliers: {len(suppliers)}\n'
                    f'Warehouses: {len(warehouses)}\n'
                    f'Products: {len(products)}\n'
                    f'Customers: {len(customers)}\n'
                    f'Orders: {len(orders)}\n'
                )
            )
        finally:
            clear_org_context()

    def clean_existing_data(self):
        """Clean existing data for this organization"""
        self.stdout.write('🧹 Cleaning existing data...')
        # Reverse dependency order
        Shipment.objects.filter(org=self.org).delete()
        OrderItem.objects.filter(order__org=self.org).delete()
        Order.objects.filter(org=self.org).delete()
        Inventory.objects.filter(product__org=self.org).delete()
        Product.objects.filter(org=self.org).delete()
        Customer.objects.filter(org=self.org).delete()
        Warehouse.objects.filter(org=self.org).delete()
        Supplier.objects.filter(org=self.org).delete()

    def create_suppliers(self, count):
        self.stdout.write(f'👥 Creating {count} suppliers...')
        supplier_data = [
            ('Global Electronics Ltd', 'Electronics & Components', 'John Smith', 'john@globalelec.com'),
            ('Pacific Manufacturing', 'Industrial Equipment', 'Sarah Chen', 'sarah@pacman.com'),
            ('European Textiles Co', 'Fabrics & Materials', 'Pierre Dubois', 'pierre@eutextiles.eu'),
            ('American Steel Works', 'Raw Materials', 'Mike Johnson', 'mike@amsteel.com'),
            ('Asian Plastics Inc', 'Polymer Products', 'Tanaka Hiroshi', 'tanaka@asianplastics.jp'),
            ('Nordic Wood Solutions', 'Lumber & Wood', 'Lars Andersen', 'lars@nordicwood.no'),
            ('Mediterranean Foods', 'Food & Beverages', 'Marco Rossi', 'marco@medfood.it'),
            ('Tech Components LLC', 'Computer Parts', 'David Park', 'david@techcomp.com'),
        ]
        suppliers = []
        for i in range(count):
            data = supplier_data[i % len(supplier_data)]
            supplier = Supplier.objects.create(
                org=self.org,  # 🔑 ForeignKey assignment!
                name=f"{data[0]} {i+1}" if i >= len(supplier_data) else data[0],
                contact_name=data[2],
                email=f"{data[3].split('@')[0]}{i+1}@{data[3].split('@')[1]}" if i >= len(supplier_data) else data[3],
                phone=f"+1-555-{random.randint(1000, 9999)}",
                address=f"{random.randint(100, 9999)} Industrial Blvd, {random.choice(['NY', 'CA', 'TX', 'FL'])}"
            )
            suppliers.append(supplier)
        return suppliers

    def create_warehouses(self, count):
        self.stdout.write(f'🏢 Creating {count} warehouses...')
        warehouse_locations = [
            ('Main Distribution Center', 'New York, NY - Primary distribution hub'),
            ('West Coast Facility', 'Los Angeles, CA - West coast operations'),
            ('Midwest Hub', 'Chicago, IL - Central distribution point'),
            ('Southeast Center', 'Atlanta, GA - Southeast regional hub'),
            ('Texas Distribution', 'Dallas, TX - Southwest operations'),
            ('Northeast Facility', 'Boston, MA - Northeast regional center'),
        ]
        warehouses = []
        for i in range(count):
            location_data = warehouse_locations[i % len(warehouse_locations)]
            warehouse = Warehouse.objects.create(
                org=self.org,
                name=f"{location_data[0]} {i+1}" if i >= len(warehouse_locations) else location_data[0],
                location=location_data[1]
            )
            warehouses.append(warehouse)
        return warehouses

    def create_products(self, count, suppliers):
        self.stdout.write(f'📦 Creating {count} products...')
        product_categories = [
            ('Electronics', ['Smartphone', 'Laptop', 'Tablet', 'Headphones', 'Smart Watch', 'Camera']),
            ('Industrial', ['Motor', 'Pump', 'Valve', 'Sensor', 'Controller', 'Generator']),
            ('Textiles', ['Cotton Fabric', 'Polyester Blend', 'Wool Material', 'Silk Cloth', 'Denim']),
            ('Raw Materials', ['Steel Sheet', 'Aluminum Rod', 'Copper Wire', 'Plastic Pellets', 'Rubber Sheet']),
            ('Food', ['Organic Flour', 'Premium Coffee', 'Olive Oil', 'Spice Mix', 'Canned Goods']),
            ('Components', ['Circuit Board', 'Processor Chip', 'Memory Module', 'Power Supply', 'Cable Assembly']),
        ]
        products = []
        for i in range(count):
            category, items = random.choice(product_categories)
            item_name = random.choice(items)
            supplier = random.choice(suppliers)
            # Realistic pricing by category
            if category == 'Electronics':
                base_price = random.uniform(50, 2000)
            elif category == 'Industrial':
                base_price = random.uniform(100, 5000)
            elif category == 'Raw Materials':
                base_price = random.uniform(5, 100)
            else:
                base_price = random.uniform(10, 500)
            product = Product.objects.create(
                org=self.org,
                name=f"{item_name} {category} Model {i+1:03d}",
                description=f"High-quality {item_name.lower()} from {supplier.name}. Premium grade {category.lower()} product.",
                supplier=supplier,
                price=Decimal(str(round(base_price, 2))),
                stock_quantity=random.randint(10, 1000),
                client_name=self.org.slug
            )
            products.append(product)
        return products

    def create_customers(self, count):
        self.stdout.write(f'👤 Creating {count} customers...')
        company_types = ['Corp', 'Inc', 'LLC', 'Ltd', 'Co', 'Solutions', 'Systems', 'Industries']
        business_names = [
            'TechStart', 'InnovateCorp', 'GlobalTech', 'SmartSolutions', 'DataDriven',
            'CloudFirst', 'DigitalEdge', 'FutureTech', 'NextGen', 'ProActive',
            'StreamLine', 'OptimalOps', 'PrecisionTech', 'AgileWorks', 'ScaleUp'
        ]
        customers = []
        for i in range(count):
            business_name = random.choice(business_names)
            company_type = random.choice(company_types)
            full_name = f"{business_name} {company_type}"
            customer = Customer.objects.create(
                org=self.org,
                name=full_name,
                email=f"orders@{business_name.lower()}{i+1}.com",
                phone=f"+1-555-{random.randint(1000, 9999)}",
                address=f"{random.randint(100, 9999)} Business Ave, {random.choice(['NY', 'CA', 'TX', 'FL', 'IL'])}"
            )
            customers.append(customer)
        return customers

    def create_inventory(self, products, warehouses):
        self.stdout.write(f'📊 Creating inventory records...')
        for product in products:
            assigned_warehouses = random.sample(warehouses, random.randint(1, min(3, len(warehouses))))
            for warehouse in assigned_warehouses:
                quantity = random.randint(0, 500)
                Inventory.objects.create(
                    product=product,
                    warehouse=warehouse,
                    quantity=quantity
                )

    def create_orders(self, count, customers, products):
        self.stdout.write(f'🛒 Creating {count} orders...')
        orders = []
        for i in range(count):
            customer = random.choice(customers)
            order_date = timezone.now() - timedelta(days=random.randint(0, 90))
            order = Order.objects.create(
                org=self.org,
                customer=customer,
                order_date=order_date,
                status=random.choice(['Pending', 'Shipped', 'Delivered', 'Cancelled']),
                client_name=self.org.slug
            )
            order_products = random.sample(products, random.randint(1, min(5, len(products))))
            for product in order_products:
                quantity = random.randint(1, 10)
                unit_price = product.price * Decimal(str(random.uniform(0.9, 1.1)))
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=unit_price
                )
            orders.append(order)
        return orders

    def create_shipments(self, orders, warehouses):
        self.stdout.write(f'🚚 Creating shipments...')
        shipped_orders = [order for order in orders if order.status in ['Shipped', 'Delivered']]
        for order in shipped_orders:
            warehouse = random.choice(warehouses)
            shipped_date = order.order_date + timedelta(days=random.randint(1, 3))
            estimated_arrival = shipped_date + timedelta(days=random.randint(2, 7))
            if order.status == 'Delivered':
                status = 'delivered'
            elif timezone.now() > estimated_arrival:
                status = random.choice(['delivered', 'delayed'])
            else:
                status = random.choice(['on_time', 'delayed'])
            Shipment.objects.create(
                org=self.org,
                order=order,
                warehouse=warehouse,
                shipped_date=shipped_date,
                estimated_arrival=estimated_arrival,
                status=status,
                client_name=self.org.slug
            )
