# Generated by Django 5.1.6 on 2025-06-30 20:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='analyticsdashboard',
            name='layout',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
