# Generated by Django 5.1.6 on 2025-07-09 06:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0005_uploadedfile_org_id_alter_uploadedfile_client_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='uploadedfile',
            name='client_id',
        ),
        migrations.RemoveField(
            model_name='uploadedfile',
            name='org_id',
        ),
        migrations.AddField(
            model_name='uploadedfile',
            name='client_name',
            field=models.CharField(default='', max_length=100),
        ),
    ]
