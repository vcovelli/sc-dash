# Generated by Django 5.1.6 on 2025-07-01 03:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_useractivity'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useractivity',
            name='target',
            field=models.CharField(blank=True, max_length=1024, null=True),
        ),
    ]
