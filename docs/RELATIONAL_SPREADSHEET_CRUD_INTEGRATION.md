# Relational Spreadsheet CRUD Integration Guide

## Overview

This guide explains how the backend schema CRUD operations are wired up to the frontend relational spreadsheet UI, providing users with a fully functional data management interface that respects permissions and ensures data persistence.

## Architecture

### Backend Components

1. **Django ViewSets** (`backend/api/views/default_user_tables/`)
   - `TenantScopedViewSet`: Base class with organization-based multi-tenancy
   - Individual ViewSets for each table: Suppliers, Warehouses, Products, Customers, Orders, etc.
   - Built-in permissions using `IsReadOnlyOrAbove`

2. **Models** (`backend/api/models.py`)
   - `AuditableModel`: Base model with created_by, modified_by, timestamps, and versioning
   - Organization-scoped models ensuring data isolation
   - Proper relationships between entities (ForeignKeys)

3. **Serializers** (`backend/api/serializers.py`)
   - Data validation and transformation
   - Related field serialization (e.g., supplier_name in ProductSerializer)

### Frontend Components

1. **TableAPI** (`frontend/lib/tableAPI.ts`)
   - Unified interface for all CRUD operations
   - Type-safe methods for each table type
   - Permission checking and error handling
   - Bulk operations support

2. **useTableData Hook** (`frontend/hooks/useTableData.ts`)
   - React hook for state management
   - Optimistic updates for better UX
   - Auto-refresh capabilities
   - Permission-aware operations

3. **Data Mapping Utilities** (`frontend/lib/tableDataMapping.ts`)
   - Transform data between backend and frontend formats
   - Field validation
   - Reference data handling

4. **Enhanced UI Components**
   - Updated `SheetsPageInner.tsx` with CRUD integration
   - Permission-aware GridTable
   - Real-time error handling and loading states

## Features

### ✅ Data Persistence
- All user changes are automatically saved to the backend
- Optimistic updates provide immediate feedback
- Automatic rollback on errors

### ✅ Permission Management
- Role-based access control (RBAC)
- Organization-level data isolation
- Permission indicators in UI
- Graceful handling of insufficient permissions

### ✅ Real-time Operations
- **Create**: Add new rows with proper validation
- **Read**: Load data with pagination and filtering
- **Update**: Edit cells with instant persistence
- **Delete**: Remove rows with confirmation

### ✅ Advanced Features
- Bulk operations for multiple records
- Search and filtering
- Column sorting
- Reference field handling (dropdowns with related data)
- Data validation with user-friendly error messages

## How It Works

### 1. Data Loading

When a user selects a table:

```typescript
// SheetsPageInner.tsx
const {
  state: { data, loading, error, permissions },
  actions: { refresh, createRecord, updateRecord, deleteRecord }
} = useTableData({
  tableName: activeTableName,
  autoRefresh: true,
  refreshInterval: 30000
});
```

The `useTableData` hook:
1. Checks user permissions for the table
2. Loads data from the appropriate API endpoint
3. Transforms backend data to frontend format
4. Sets up auto-refresh if enabled

### 2. Cell Editing

When a user edits a cell:

```typescript
const handleCellUpdate = async (rowIndex: number, columnId: string, newValue: any) => {
  if (!canPerformAction('update')) return;
  
  const row = rows[rowIndex];
  const updatedRecord = await updateRecord(row.id, { [columnId]: newValue });
  
  if (updatedRecord) {
    // Update local state optimistically
    updateLocalRows(rowIndex, columnId, newValue);
  }
};
```

The process:
1. Validates user has update permissions
2. Performs optimistic update in UI
3. Sends PATCH request to backend
4. Reverts on error or confirms on success

### 3. Adding New Records

When a user adds a new row:

```typescript
const handleAddRow = async () => {
  if (!canPerformAction('create')) return;
  
  const emptyRow = generateEmptyRow(columns);
  const newRecord = await createRecord(emptyRow);
  
  if (newRecord) {
    setRows([...rows, newRecord]);
  }
};
```

The system:
1. Generates a new row with default values
2. Validates required fields
3. Sends POST request to create record
4. Adds to local state on success

### 4. Permission Checking

Permissions are checked at multiple levels:

```typescript
// Backend - ViewSet level
class SupplierViewSet(TenantScopedViewSet):
    permission_classes = [IsReadOnlyOrAbove]

// Frontend - Hook level
async checkPermissions(tableName: string, action: string): Promise<boolean> {
  const response = await api.options(`/${tableName}/`);
  return response.headers.allow.includes(methodMap[action]);
}

// UI level - Component rendering
{permissions.canCreate && (
  <button onClick={handleAddRow}>+ Add Row</button>
)}
```

### 5. Error Handling

Comprehensive error handling throughout:

```typescript
try {
  const updatedRecord = await updateRecord(row.id, data);
} catch (error) {
  if (error instanceof TableAPIError) {
    // Revert optimistic update
    revertChanges();
    // Show user-friendly error
    showErrorMessage(error.message);
  }
}
```

## API Endpoints

### Standard CRUD Operations

Each table supports the full REST API:

```
GET    /api/suppliers/           # List all suppliers
POST   /api/suppliers/           # Create new supplier
GET    /api/suppliers/{id}/      # Get specific supplier
PATCH  /api/suppliers/{id}/      # Update supplier
DELETE /api/suppliers/{id}/      # Delete supplier
```

### Query Parameters

- `search`: Text search across searchable fields
- `ordering`: Sort by field (prefix with `-` for descending)
- `page`: Pagination
- `{field}`: Filter by specific field values

Example:
```
/api/products/?search=laptop&ordering=-price&supplier=1
```

### Bulk Operations

The frontend supports bulk operations:

```typescript
// Bulk update multiple records
await bulkUpdate([
  { id: 1, data: { price: 100 } },
  { id: 2, data: { price: 200 } }
]);

// Bulk create multiple records
await bulkCreate([
  { name: 'Product A', price: 50 },
  { name: 'Product B', price: 75 }
]);

// Bulk delete multiple records
await bulkDelete([1, 2, 3]);
```

## Table Relationships

The system handles complex relationships between tables:

### Products → Suppliers
- Products reference suppliers via foreign key
- UI shows supplier name in dropdown
- Validates supplier exists before saving

### Orders → Customers
- Orders reference customers
- Customer information displayed in order view
- Cascading updates when customer changes

### Inventory → Products + Warehouses
- Many-to-many relationship tracking
- Real-time stock level updates
- Validation prevents negative inventory

## Validation Rules

### Client-side Validation
- Required field checking
- Email format validation
- Number range validation
- Date format validation
- Reference field existence

### Server-side Validation
- Django model validation
- Business logic constraints
- Organization-level data isolation
- Audit trail maintenance

## Security Features

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure session management

### Authorization
- Role-based permissions
- Organization-level data isolation
- Field-level access control
- Audit logging

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Performance Optimizations

### Frontend
- Optimistic updates for instant feedback
- Pagination for large datasets
- Virtual scrolling for performance
- Debounced search queries
- Cached reference data

### Backend
- Database query optimization
- Efficient serialization
- Proper indexing
- Connection pooling
- Response compression

## Usage Examples

### Basic CRUD Operations

```typescript
// Create a new supplier
const newSupplier = await tableAPI.createSupplier({
  name: "New Supplier Inc.",
  email: "contact@newsupplier.com",
  phone: "555-0123"
});

// Update supplier information
const updatedSupplier = await tableAPI.updateSupplier(1, {
  phone: "555-0124"
});

// Delete a supplier
await tableAPI.deleteSupplier(1);

// Get suppliers with filtering
const suppliers = await tableAPI.getSuppliers({
  search: "tech",
  ordering: "name"
});
```

### Using the React Hook

```typescript
function ProductsTable() {
  const {
    state: { data, loading, permissions },
    actions: { createRecord, updateRecord, deleteRecord },
    utils: { canPerformAction }
  } = useTableData({ tableName: 'products' });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canPerformAction('create') && (
        <button onClick={() => createRecord({name: 'New Product'})}>
          Add Product
        </button>
      )}
      
      <DataGrid 
        data={data}
        onCellEdit={updateRecord}
        onRowDelete={deleteRecord}
        readOnly={!permissions.canUpdate}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role in organization
   - Verify endpoint permissions
   - Check organization membership

2. **Data Not Persisting**
   - Verify API connection
   - Check authentication tokens
   - Validate data format

3. **Reference Fields Not Working**
   - Ensure reference table data is loaded
   - Check foreign key constraints
   - Verify reference display field

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug', 'tableapi:*');

// This will log all API requests and responses
```

## Future Enhancements

- Real-time collaborative editing
- Advanced filtering UI
- Export to CSV/Excel
- Import from external sources
- Custom field types
- Workflow automation
- Advanced reporting

## Conclusion

The integrated CRUD system provides a seamless experience for users to manage their relational data through an intuitive spreadsheet interface while maintaining proper security, validation, and performance standards. The architecture is designed to be extensible and maintainable, supporting the addition of new tables and features as needed.