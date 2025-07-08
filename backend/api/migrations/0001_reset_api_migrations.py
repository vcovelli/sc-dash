from django.db import migrations

class Migration(migrations.Migration):

    dependencies = []

    operations = [
        migrations.RunSQL("DELETE FROM django_migrations WHERE app = 'api';")
    ]
