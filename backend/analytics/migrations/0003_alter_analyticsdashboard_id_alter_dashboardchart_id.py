# Generated by Django 5.1.6 on 2025-07-05 19:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0002_alter_analyticsdashboard_layout'),
    ]

    operations = [
        migrations.AlterField(
            model_name='analyticsdashboard',
            name='id',
            field=models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='dashboardchart',
            name='id',
            field=models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]
