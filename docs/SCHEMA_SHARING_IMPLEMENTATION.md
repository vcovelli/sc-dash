# Schema Sharing Implementation

## Overview

I've implemented organization-wide schema sharing functionality that allows schemas to be shared across users in an organization with proper permission controls. The implementation maintains backward compatibility for solo users while adding powerful collaboration features for teams.

## Key Features

### 1. Enhanced Schema Model (`UserTableSchema`)

**New fields added:**
- `sharing_level`: Choice field (`personal` or `organization`)
- `is_shared`: Boolean flag for quick identification of shared schemas
- `shared_by`: Foreign key to the user who shared the schema
- `shared_at`: Timestamp when schema was shared

**New methods:**
- `share_organization_wide(shared_by_user)`: Convert personal schema to organization-wide
- `make_personal()`: Revert shared schema to personal
- `can_user_edit(user)`: Check if user can edit this schema
- `can_user_share(user)`: Check if user can share/unshare this schema

### 2. Permission System Integration

**New permission classes added:**
- `CanCreateSchemas`: Basic schema creation permission
- `CanShareSchemas`: Permission to share schemas organization-wide
- `CanManageSharedSchemas`: Permission to edit shared schemas
- `CanAccessSharedSchemas`: Permission to view shared schemas
- `CanAccessSchema`: Object-level permission for schema access
- `CanEditSchema`: Object-level permission for schema editing

**Permission hierarchy respected:**
- **Managers and above** (admin, owner, ceo, national_manager, regional_manager, local_manager): Can share schemas and edit shared schemas
- **Employees**: Can create personal schemas and use shared schemas
- **Clients**: Can use shared schemas (read-only)
- **Read-only users**: Limited to their own personal schemas

### 3. Updated API Endpoints

**Enhanced existing endpoints:**

`GET /api/datagrid/schemas/`
- Now returns both personal and accessible shared schemas
- Added query parameter `sharing_level` (`personal` or `shared`)
- Includes permission indicators (`can_edit`, `can_share`, `can_unshare`)

`POST /api/datagrid/schemas/`
- Added `sharing_level` parameter for creating shared schemas directly
- Validates user permissions for organization-wide creation

`GET/PATCH/DELETE /api/datagrid/schemas/{table_name}/`
- Enhanced to handle both personal and shared schema access
- Permission-based editing restrictions
- Only schema owners can delete schemas

**New endpoints:**

`GET /api/datagrid/schemas/shared/`
- Lists all organization-wide shared schemas
- Requires `CanAccessSharedSchemas` permission

`POST /api/datagrid/schemas/{table_name}/share/`
- Share a personal schema organization-wide
- Logs activity for audit trail

`DELETE /api/datagrid/schemas/{table_name}/share/`
- Unshare a schema (make it personal)
- Logs activity for audit trail

### 4. Enhanced Serializer

**UserTableSchemaSerializer updates:**
- Added sharing-related fields to API responses
- Permission indicators for UI controls
- Validation for sharing level changes
- Auto-handling of sharing operations

**New fields in API responses:**
```json
{
  "sharing_level": "organization",
  "is_shared": true,
  "shared_by": 5,
  "shared_by_username": "manager_user",
  "shared_at": "2024-01-15T10:30:00Z",
  "can_edit": true,
  "can_share": true,
  "can_unshare": true
}
```

## Usage Examples

### 1. Creating a Shared Schema
```javascript
// POST /api/datagrid/schemas/
{
  "table_name": "customer_data",
  "columns": [...],
  "sharing_level": "organization"  // Requires manager+ role
}
```

### 2. Sharing an Existing Schema
```javascript
// POST /api/datagrid/schemas/customer_data/share/
// Converts personal schema to organization-wide
```

### 3. Filtering Schemas
```javascript
// GET /api/datagrid/schemas/?sharing_level=shared
// Returns only shared schemas

// GET /api/datagrid/schemas/?sharing_level=personal
// Returns only personal schemas
```

### 4. Checking Permissions
```javascript
// The API response includes permission flags:
{
  "table_name": "customer_data",
  "can_edit": false,      // Current user cannot edit
  "can_share": false,     // Current user cannot share
  "can_unshare": false,   // Current user cannot unshare
  "is_shared": true,      // Schema is shared organization-wide
  "shared_by_username": "admin_user"
}
```

## Database Changes

**New indexes added for performance:**
- `org, sharing_level` - Fast filtering of shared schemas
- `org, is_shared` - Quick identification of shared schemas
- `user, org, table_name` - Optimized personal schema lookup

**Migration required:**
The implementation includes new fields that require a database migration:
```bash
python manage.py makemigrations datagrid
python manage.py migrate
```

## Backward Compatibility

- **Existing schemas**: All current schemas default to `sharing_level='personal'`
- **Solo users**: No functional changes - they continue to work with personal schemas
- **API compatibility**: All existing API calls continue to work unchanged
- **Frontend compatibility**: New fields are optional in API responses

## Security Considerations

1. **Organization isolation**: Users can only see schemas within their organization
2. **Permission validation**: All sharing operations validate user permissions
3. **Audit trail**: All sharing/unsharing actions are logged to `UserActivity`
4. **Ownership protection**: Only schema owners can delete schemas
5. **Role-based access**: Different permission levels based on user roles

## Frontend Integration Points

The implementation provides everything needed for frontend integration:

1. **Permission flags**: UI can show/hide sharing controls based on `can_share`, `can_edit` flags
2. **Schema status**: UI can display sharing status using `is_shared`, `shared_by_username`
3. **Filtering**: UI can filter between personal and shared schemas
4. **Real-time updates**: API provides immediate feedback on sharing operations

## Performance Optimizations

1. **Database indexes**: Added strategic indexes for common query patterns
2. **Efficient filtering**: Uses `Q` objects for complex organization/sharing queries
3. **Minimal overhead**: Only queries shared schemas when necessary
4. **Caching-ready**: Permission checks are efficient and can be cached

## Error Handling

The implementation includes comprehensive error handling:
- Permission denied errors with helpful messages
- Validation errors for invalid sharing operations
- Not found errors for inaccessible schemas
- Conflict errors for duplicate operations

## Next Steps

To complete the implementation:

1. **Install missing dependencies** (google-auth, etc.)
2. **Run database migrations**
3. **Update frontend** to use new sharing features
4. **Add user interface** for sharing controls
5. **Configure notifications** for shared schema updates (optional)

## Files Modified

1. `backend/datagrid/models.py` - Enhanced UserTableSchema model
2. `backend/accounts/permissions.py` - Added schema-specific permissions
3. `backend/datagrid/serializers.py` - Updated serializer with sharing fields
4. `backend/datagrid/views/schema.py` - Enhanced views with sharing logic
5. `backend/datagrid/urls.py` - Added new sharing endpoints

This implementation provides a robust, secure, and scalable solution for schema sharing that integrates seamlessly with your existing permission system and maintains full backward compatibility.