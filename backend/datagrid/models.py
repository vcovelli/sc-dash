from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Organization
from django.db.models import JSONField
from datetime import datetime, timezone

User = get_user_model()

class UserTableSchema(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="table_schemas")
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='table_schemas',
        help_text="Organization this table schema belongs to",
        null=True, blank=True,
    )
    table_name = models.CharField(max_length=128)
    db_table_name = models.CharField(max_length=128, blank=True, null=True)
    primary_key = models.CharField(max_length=128, default="id")
    columns = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "org", "table_name")

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email or self.user.username} - {self.table_name} schema ({self.org.name})"

class UserTableRow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='table_rows',
        help_text="Organization this table row belongs to",
        null=True, blank=True,
    )
    table_name = models.CharField(max_length=128)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.table_name} row by {self.user.username} ({self.org.name})"

class UserGridConfig(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='grid_configs',
        help_text="Organization this grid config belongs to",
        null=True, blank=True,
    )
    table_name = models.CharField(max_length=128)
    column_order = models.JSONField(default=list, blank=True)
    column_widths = models.JSONField(default=dict, blank=True)
    column_visibility = models.JSONField(default=dict, blank=True)
    column_names = models.JSONField(default=dict, blank=True)
    extra_options = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "org", "table_name")

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.table_name} config by {self.user.username} ({self.org.name})"

class DataIngestionJob(models.Model):
    """Track data ingestion jobs with comprehensive metadata"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PIPELINE_CHOICES = [
        ('legacy', 'Legacy Pipeline'),
        ('enhanced', 'Enhanced Pipeline v2.0'),
    ]
    
    job_id = models.CharField(max_length=128, unique=True)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='ingestion_jobs')
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # File and table information
    file_id = models.CharField(max_length=128)
    file_name = models.CharField(max_length=512)
    table_name = models.CharField(max_length=128)
    client_id = models.CharField(max_length=128, null=True, blank=True)
    
    # Pipeline metadata
    pipeline_version = models.CharField(max_length=20, choices=PIPELINE_CHOICES, default='enhanced')
    airflow_dag_id = models.CharField(max_length=128, null=True, blank=True)
    airflow_run_id = models.CharField(max_length=128, null=True, blank=True)
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Processing metrics
    total_records_processed = models.IntegerField(default=0)
    records_inserted = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    
    # Data quality metrics
    average_quality_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    quality_metrics = JSONField(default=dict, blank=True)
    
    # Error information
    error_message = models.TextField(null=True, blank=True)
    error_details = JSONField(default=dict, blank=True)
    
    # Configuration
    configuration = JSONField(default=dict, blank=True)
    processing_metadata = JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org', 'status']),
            models.Index(fields=['org', 'table_name']),
            models.Index(fields=['created_at']),
            models.Index(fields=['initiated_by']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.table_name} - {self.status} ({self.job_id})"
    
    @property
    def duration(self):
        """Calculate job duration"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        elif self.started_at:
            return datetime.now(timezone.utc) - self.started_at
        return None
    
    @property
    def success_rate(self):
        """Calculate success rate for processed records"""
        total = self.total_records_processed
        if total == 0:
            return 0.0
        successful = self.records_inserted + self.records_updated
        return (successful / total) * 100

class DataLineage(models.Model):
    """Track data lineage and transformations"""
    
    TRANSFORMATION_TYPES = [
        ('ingestion', 'Data Ingestion'),
        ('validation', 'Data Validation'),
        ('transformation', 'Data Transformation'),
        ('aggregation', 'Data Aggregation'),
        ('export', 'Data Export'),
    ]
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_lineage')
    
    # Source and destination
    source_system = models.CharField(max_length=128)  # e.g., 'MinIO', 'MongoDB', 'PostgreSQL'
    source_identifier = models.CharField(max_length=512)  # e.g., file path, collection name, table name
    destination_system = models.CharField(max_length=128)
    destination_identifier = models.CharField(max_length=512)
    
    # Transformation details
    transformation_type = models.CharField(max_length=20, choices=TRANSFORMATION_TYPES)
    transformation_description = models.TextField()
    transformation_rules = JSONField(default=dict, blank=True)
    
    # Metadata
    composite_keys_affected = JSONField(default=list, blank=True)
    records_affected = models.IntegerField(default=0)
    transformation_timestamp = models.DateTimeField(auto_now_add=True)
    
    # Job reference
    ingestion_job = models.ForeignKey(DataIngestionJob, on_delete=models.CASCADE, 
                                    related_name='lineage_entries', null=True, blank=True)
    
    # Additional metadata
    metadata = JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-transformation_timestamp']
        indexes = [
            models.Index(fields=['org', 'transformation_timestamp']),
            models.Index(fields=['source_system', 'source_identifier']),
            models.Index(fields=['destination_system', 'destination_identifier']),
        ]
    
    def __str__(self):
        return f"{self.org.name}: {self.source_system} -> {self.destination_system} ({self.transformation_type})"

class DataQualityReport(models.Model):
    """Store data quality reports and metrics over time"""
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='quality_reports')
    table_name = models.CharField(max_length=128)
    
    # Reporting period
    report_date = models.DateField()
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Record counts
    total_records = models.IntegerField(default=0)
    records_with_errors = models.IntegerField(default=0)
    records_with_warnings = models.IntegerField(default=0)
    
    # Quality scores
    overall_quality_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    completeness_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    consistency_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    validity_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    
    # Detailed metrics
    detailed_metrics = JSONField(default=dict, blank=True)
    
    # Issues found
    quality_issues = JSONField(default=list, blank=True)
    recommendations = JSONField(default=list, blank=True)
    
    # Job reference
    ingestion_job = models.ForeignKey(DataIngestionJob, on_delete=models.CASCADE, 
                                    related_name='quality_reports', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-report_date', '-created_at']
        unique_together = ['org', 'table_name', 'report_date']
        indexes = [
            models.Index(fields=['org', 'table_name', 'report_date']),
            models.Index(fields=['overall_quality_score']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.table_name} Quality Report ({self.report_date})"
    
    @property
    def error_rate(self):
        """Calculate error rate percentage"""
        if self.total_records == 0:
            return 0.0
        return (self.records_with_errors / self.total_records) * 100
    
    @property
    def warning_rate(self):
        """Calculate warning rate percentage"""
        if self.total_records == 0:
            return 0.0
        return (self.records_with_warnings / self.total_records) * 100

class DataVersionHistory(models.Model):
    """Track version history for data records"""
    
    CHANGE_TYPES = [
        ('INSERT', 'Insert'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('MERGE', 'Merge'),
    ]
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='version_history')
    table_name = models.CharField(max_length=128)
    composite_key = models.CharField(max_length=512)
    
    # Version information
    version = models.IntegerField()
    previous_version = models.IntegerField(null=True, blank=True)
    change_type = models.CharField(max_length=10, choices=CHANGE_TYPES)
    
    # Change details
    changed_fields = JSONField(default=list, blank=True)
    data_hash = models.CharField(max_length=64)
    previous_data_hash = models.CharField(max_length=64, null=True, blank=True)
    
    # Audit information
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    change_timestamp = models.DateTimeField(auto_now_add=True)
    change_reason = models.TextField(null=True, blank=True)
    
    # Source information
    source_file = models.CharField(max_length=512, null=True, blank=True)
    ingestion_job = models.ForeignKey(DataIngestionJob, on_delete=models.CASCADE, 
                                    related_name='version_history', null=True, blank=True)
    
    # Validation and quality
    validation_status = models.CharField(max_length=20, default='UNKNOWN')
    quality_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    
    # Additional metadata
    metadata = JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-change_timestamp']
        unique_together = ['org', 'table_name', 'composite_key', 'version']
        indexes = [
            models.Index(fields=['org', 'table_name', 'composite_key']),
            models.Index(fields=['composite_key', 'version']),
            models.Index(fields=['change_timestamp']),
            models.Index(fields=['changed_by']),
            models.Index(fields=['change_type']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.table_name} - {self.composite_key} v{self.version}"

class OrganizationDataMetrics(models.Model):
    """Store organization-level data metrics and usage statistics"""
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_metrics')
    
    # Date for this metrics snapshot
    metrics_date = models.DateField()
    
    # Storage metrics
    total_storage_bytes = models.BigIntegerField(default=0)
    mongodb_storage_bytes = models.BigIntegerField(default=0)
    postgresql_storage_bytes = models.BigIntegerField(default=0)
    
    # Record counts
    total_records = models.BigIntegerField(default=0)
    active_records = models.BigIntegerField(default=0)
    archived_records = models.BigIntegerField(default=0)
    
    # Table counts
    total_tables = models.IntegerField(default=0)
    active_tables = models.IntegerField(default=0)
    
    # Processing metrics
    ingestion_jobs_count = models.IntegerField(default=0)
    successful_jobs_count = models.IntegerField(default=0)
    failed_jobs_count = models.IntegerField(default=0)
    
    # Data quality metrics
    average_quality_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0)
    records_with_quality_issues = models.BigIntegerField(default=0)
    
    # User activity
    active_users_count = models.IntegerField(default=0)
    total_user_actions = models.IntegerField(default=0)
    
    # Performance metrics
    average_ingestion_time_seconds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    average_query_time_ms = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Additional metrics
    detailed_metrics = JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-metrics_date']
        unique_together = ['org', 'metrics_date']
        indexes = [
            models.Index(fields=['org', 'metrics_date']),
            models.Index(fields=['metrics_date']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - Metrics ({self.metrics_date})"
    
    @property
    def success_rate(self):
        """Calculate job success rate"""
        total_jobs = self.ingestion_jobs_count
        if total_jobs == 0:
            return 0.0
        return (self.successful_jobs_count / total_jobs) * 100
    
    @property
    def storage_efficiency(self):
        """Calculate storage efficiency (records per byte)"""
        if self.total_storage_bytes == 0:
            return 0.0
        return self.total_records / self.total_storage_bytes

class DataAlert(models.Model):
    """Store data quality and processing alerts"""
    
    ALERT_TYPES = [
        ('quality', 'Data Quality Issue'),
        ('processing', 'Processing Failure'),
        ('performance', 'Performance Issue'),
        ('storage', 'Storage Issue'),
        ('security', 'Security Issue'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_alerts')
    
    # Alert details
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_LEVELS)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Context
    table_name = models.CharField(max_length=128, null=True, blank=True)
    composite_key = models.CharField(max_length=512, null=True, blank=True)
    ingestion_job = models.ForeignKey(DataIngestionJob, on_delete=models.CASCADE, 
                                    related_name='alerts', null=True, blank=True)
    
    # Status and assignment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='assigned_alerts')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Resolution
    resolution_notes = models.TextField(null=True, blank=True)
    
    # Additional metadata
    metadata = JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org', 'status']),
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['alert_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.org.name} - {self.title} ({self.severity})"
