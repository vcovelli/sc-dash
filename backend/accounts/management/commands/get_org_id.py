from django.core.management.base import BaseCommand
from accounts.models import Organization

class Command(BaseCommand):
    help = "Get organization ID by name"

    def add_arguments(self, parser):
        parser.add_argument('--org-name', type=str, required=True)

    def handle(self, *args, **options):
        org = Organization.objects.get(name=options['org_name'])
        self.stdout.write(str(org.id))
