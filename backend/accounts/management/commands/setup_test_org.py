from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Organization, CustomUser

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test organization and users for RBAC testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-name',
            type=str,
            default='Test Organization',
            help='Name of the test organization',
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing test data first',
        )

    def handle(self, *args, **options):
        org_name = options['org_name']
        
        if options['clean']:
            self.stdout.write('Cleaning existing test data...')
            Organization.objects.filter(name__icontains='Test').delete()
            CustomUser.objects.filter(email__icontains='test').delete()

        # Create or get organization
        org, created = Organization.objects.get_or_create(
            name=org_name,
            defaults={'slug': org_name.lower().replace(' ', '-')}
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created organization: {org.name}')
            )
        else:
            self.stdout.write(f'Using existing organization: {org.name}')

        # Create test users with different roles
        test_users = [
            {
                'email': 'owner@test.com',
                'username': 'owner_test',
                'first_name': 'Owner',
                'last_name': 'Test',
                'role': 'owner',
                'password': 'testpass123'
            },
            {
                'email': 'manager@test.com',
                'username': 'manager_test',
                'first_name': 'Manager',
                'last_name': 'Test',
                'role': 'national_manager',
                'password': 'testpass123'
            },
            {
                'email': 'employee@test.com',
                'username': 'employee_test',
                'first_name': 'Employee',
                'last_name': 'Test',
                'role': 'employee',
                'password': 'testpass123'
            },
            {
                'email': 'client@test.com',
                'username': 'client_test',
                'first_name': 'Client',
                'last_name': 'Test',
                'role': 'client',
                'password': 'testpass123'
            },
            {
                'email': 'readonly@test.com',
                'username': 'readonly_test',
                'first_name': 'ReadOnly',
                'last_name': 'Test',
                'role': 'read_only',
                'password': 'testpass123'
            }
        ]

        created_users = []
        for user_data in test_users:
            user, user_created = CustomUser.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'org': org,
                }
            )
            
            if user_created:
                user.set_password(user_data['password'])
                user.save()
                created_users.append(user)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created user: {user.email} ({user.role})'
                    )
                )
            else:
                # Update existing user to ensure it's in the right org
                user.org = org
                user.role = user_data['role']
                user.save()
                self.stdout.write(f'Updated existing user: {user.email}')

        # Create a platform admin (no org)
        admin_user, admin_created = CustomUser.objects.get_or_create(
            email='admin@supplywise.ai',
            defaults={
                'username': 'platform_admin',
                'first_name': 'Platform',
                'last_name': 'Admin',
                'role': 'admin',
                'org': None,  # Platform admin has no org
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if admin_created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created platform admin: {admin_user.email}')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Setup complete!\n'
                f'Organization: {org.name}\n'
                f'Users created: {len(created_users)}\n'
                f'Test users can log in with password: testpass123\n'
                f'Platform admin can log in with password: admin123\n'
            )
        )
        
        # Display role capabilities
        self.stdout.write('\n🔐 Role Capabilities:')
        self.stdout.write('├── owner@test.com (Owner): Can invite users, manage all users')
        self.stdout.write('├── manager@test.com (National Manager): Can invite users')
        self.stdout.write('├── employee@test.com (Employee): Basic access')
        self.stdout.write('├── client@test.com (Client): Limited access')
        self.stdout.write('├── readonly@test.com (Read Only): View-only access')
        self.stdout.write('└── admin@supplywise.ai (Platform Admin): Access to all orgs')