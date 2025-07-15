from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Organization
from django.db.models import JSONField
from datetime import datetime, timezone

User = get_user_model()

# ====== ENHANCED SCHEMA MODELS ======

class UserTableSchema(models.Model):
    """Enhanced schema model with versioning and sharing capabilities"""
    
    SHARING_LEVEL_CHOICES = [
        ('private', 'Private'),
        ('org', 'Organization'),
        ('public', 'Public'),
    ]
    
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
    
    # Legacy column field - will be migrated to Column model
    columns = models.JSONField(default=list, help_text="Legacy columns field - use Column model instead")
    
    # Versioning
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True, help_text="Whether this version is the active one")
    
    # Validation
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True)
    
    # Metadata
    description = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    
    columns = models.JSONField(default=list)
    
    # New sharing fields
    sharing_level = models.CharField(
        max_length=20, 
        choices=SHARING_CHOICES, 
        default='personal',
        help_text="Determines who can access this schema"
    )
    is_shared = models.BooleanField(
        default=False, 
        help_text="Quick flag to identify shared schemas"
    )
    shared_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='shared_schemas',
        help_text="User who shared this schema organization-wide"
    )
    shared_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When this schema was shared organization-wide"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Updated unique constraint to handle sharing
        unique_together = [
            ("user", "org", "table_name"),  # Keep existing constraint for personal schemas
        ]
        indexes = [
            models.Index(fields=['org', 'sharing_level']),
            models.Index(fields=['org', 'is_shared']),
            models.Index(fields=['user', 'org', 'table_name']),
        ]

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        
        # Update is_shared flag based on sharing_level
        self.is_shared = (self.sharing_level == 'organization')
        
        # Set shared_at timestamp when first shared
        if self.is_shared and not self.shared_at:
            self.shared_at = timezone.now()
          
            if not self.shared_by:
                self.shared_by = self.user
                

        elif not self.is_shared:
            self.shared_at = None
            self.shared_by = None
            

        super().save(*args, **kwargs)

    def share_organization_wide(self, shared_by_user):
        """Make this schema available to all users in the organization"""
        self.sharing_level = 'organization'
        self.shared_by = shared_by_user
        self.shared_at = timezone.now()
        self.save()

    def make_personal(self):
        """Make this schema private to the original user"""
        self.sharing_level = 'personal'
        self.shared_by = None
        self.shared_at = None
        self.save()

    def can_user_edit(self, user):
        """Check if a user can edit this schema"""
        # Original owner can always edit
        if self.user == user:
            return True
        
        # For shared schemas, check if user has schema management permissions
        if self.is_shared and user.org == self.org:
            # Allow managers and above to edit shared schemas
            SCHEMA_EDIT_ROLES = [
                'admin', 'owner', 'ceo', 'national_manager', 
                'regional_manager', 'local_manager'
            ]
            return user.role in SCHEMA_EDIT_ROLES
        
        return False

    def can_user_share(self, user):
        """Check if a user can share/unshare this schema"""
        # Must be the owner and have sharing permissions
        if self.user != user:
            return False
        
        # Check if user has permission to share schemas
        SCHEMA_SHARE_ROLES = [
            'admin', 'owner', 'ceo', 'national_manager', 
            'regional_manager', 'local_manager'
        ]
        return user.role in SCHEMA_SHARE_ROLES

    def __str__(self):
        return f"{self.user.email or self.user.username} - {self.table_name} v{self.version} ({self.org.name})"
    
    def create_new_version(self):
        """Create a new version of this schema"""
        # Mark current versions as inactive
        UserTableSchema.objects.filter(
            user=self.user, 
            org=self.org, 
            table_name=self.table_name
        ).update(is_active=False)
        
        # Create new version
        new_version = UserTableSchema.objects.create(
            user=self.user,
            org=self.org,
            table_name=self.table_name,
            db_table_name=self.db_table_name,
            primary_key=self.primary_key,
            columns=self.columns,
            version=self.version + 1,
            sharing_level=self.sharing_level,
            description=self.description,
            tags=self.tags,
        )
        
        # Copy columns to new version
        for column in self.schema_columns.all():
            Column.objects.create(
                schema=new_version,
                name=column.name,
                data_type=column.data_type,
                order=column.order,
                is_required=column.is_required,
                default_value=column.default_value,
                choices=column.choices,
                description=column.description,
                max_length=column.max_length,
                is_primary_key=column.is_primary_key,
                is_foreign_key=column.is_foreign_key,
                foreign_key_table=column.foreign_key_table,
                foreign_key_column=column.foreign_key_column,
            )
        
        return new_version
    
    def validate_schema(self):
        """Validate the schema structure"""
        errors = []
        
        # Check if columns exist
        if not self.schema_columns.exists() and not self.columns:
            errors.append("Schema must have at least one column")
        
        # Check for duplicate column names
        column_names = list(self.schema_columns.values_list('name', flat=True))
        if len(column_names) != len(set(column_names)):
            errors.append("Duplicate column names found")
        
        # Check primary key exists
        if not self.schema_columns.filter(is_primary_key=True).exists():
            errors.append("Schema must have a primary key column")
        
        # Update validation status
        self.is_valid = len(errors) == 0
        self.validation_errors = errors
        self.save(update_fields=['is_valid', 'validation_errors'])
        
        return self.is_valid


class Column(models.Model):
    """Separate model for schema columns with enhanced metadata"""
    
    DATA_TYPE_CHOICES = [
        ('text', 'Text'),
        ('integer', 'Integer'),
        ('decimal', 'Decimal'),
        ('boolean', 'Boolean'),
        ('date', 'Date'),
        ('datetime', 'DateTime'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('json', 'JSON'),
        ('file', 'File'),
        ('reference', 'Reference'),
    ]
    
    schema = models.ForeignKey(UserTableSchema, on_delete=models.CASCADE, related_name='schema_columns')
    name = models.CharField(max_length=128)
    display_name = models.CharField(max_length=128, blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default='text')
    order = models.PositiveIntegerField(default=0)
    
    # Field properties
    is_required = models.BooleanField(default=False)
    is_unique = models.BooleanField(default=False)
    default_value = models.TextField(blank=True, null=True)
    choices = models.JSONField(default=list, blank=True, help_text="List of valid choices for this field")
    
    # Text field properties
    max_length = models.PositiveIntegerField(null=True, blank=True)
    min_length = models.PositiveIntegerField(null=True, blank=True)
    
    # Numeric field properties
    max_value = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    min_value = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    decimal_places = models.PositiveIntegerField(null=True, blank=True)
    
    # Relationship properties
    is_primary_key = models.BooleanField(default=False)
    is_foreign_key = models.BooleanField(default=False)
    foreign_key_table = models.CharField(max_length=128, blank=True, null=True)
    foreign_key_column = models.CharField(max_length=128, blank=True, null=True)
    
    # UI properties
    is_visible = models.BooleanField(default=True)
    is_editable = models.BooleanField(default=True)
    width = models.PositiveIntegerField(null=True, blank=True, help_text="Column width in pixels")
    
    # Metadata
    description = models.TextField(blank=True, null=True)
    help_text = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('schema', 'name')
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['schema', 'order']),
            models.Index(fields=['is_primary_key']),
            models.Index(fields=['data_type']),
        ]
    
    def __str__(self):
        return f"{self.schema.table_name}.{self.name} ({self.data_type})"
    
    @property
    def effective_display_name(self):
        """Return display_name if set, otherwise name"""
        return self.display_name or self.name


class SchemaHistory(models.Model):
    """Audit trail for schema changes"""
    
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('shared', 'Shared'),
        ('unshared', 'Unshared'),
        ('version_created', 'Version Created'),
        ('column_added', 'Column Added'),
        ('column_updated', 'Column Updated'),
        ('column_deleted', 'Column Deleted'),
        ('column_reordered', 'Column Reordered'),
    ]
    
    schema = models.ForeignKey(UserTableSchema, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Change details
    field_changed = models.CharField(max_length=128, blank=True, null=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    
    # Additional context
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['schema', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.schema.table_name} - {self.action} by {self.user} at {self.timestamp}"


class SchemaPermission(models.Model):
    """Fine-grained permissions for schema access"""
    
    PERMISSION_CHOICES = [
        ('view', 'View'),
        ('edit', 'Edit'),
        ('admin', 'Admin'),
    ]
    
    schema = models.ForeignKey(UserTableSchema, on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES)
    
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='granted_permissions')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('schema', 'user', 'org')
        indexes = [
            models.Index(fields=['schema', 'permission']),
            models.Index(fields=['user', 'permission']),
            models.Index(fields=['org', 'permission']),
        ]
    
    def __str__(self):
        target = self.user.username if self.user else f"org:{self.org.name}"
        return f"{self.schema.table_name} - {self.permission} for {target}"


# ====== EXISTING MODELS (UNCHANGED) ======

        sharing_indicator = " [SHARED]" if self.is_shared else ""
        return f"{self.user.email or self.user.username} - {self.table_name} schema ({self.org.name}){sharing_indicator}"


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
