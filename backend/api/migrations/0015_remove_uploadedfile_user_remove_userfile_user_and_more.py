# Generated by Django 5.1.6 on 2025-07-03 22:46

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_customer_created_at_customer_created_by_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='uploadedfile',
            name='user',
        ),
        migrations.RemoveField(
            model_name='userfile',
            name='user',
        ),
        migrations.AlterUniqueTogether(
            name='usertableschema',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='usertableschema',
            name='user',
        ),
        migrations.DeleteModel(
            name='OnboardingProgress',
        ),
        migrations.DeleteModel(
            name='UploadedFile',
        ),
        migrations.DeleteModel(
            name='UserFile',
        ),
        migrations.DeleteModel(
            name='UserTableSchema',
        ),
    ]
