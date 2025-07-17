import { CustomColumnDef, Row } from '@/app/(authenticated)/relational-ui/components/Sheet';
import { 
  Supplier, 
  Warehouse, 
  Product, 
  Customer, 
  Order
} from './tableAPI';

// Map backend data to frontend Row format
export function mapApiDataToRows<T = Record<string, unknown>>(data: T[]): Row[] {
  return data.map((record: Record<string, unknown>) => ({
    ...record,
    __rowId: record.id,
  }));
}

// Map frontend Row format back to backend data format
export function mapRowsToApiData(rows: Row[]): Record<string, unknown>[] {
  return rows.map(row => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { __rowId, ...cleanRow } = row;
    return cleanRow;
  });
}

// Convert backend field types to frontend column types
export function getColumnTypeFromBackendField(fieldType: string): string {
  const typeMap: Record<string, string> = {
    'CharField': 'text',
    'EmailField': 'email',
    'TextField': 'text',
    'IntegerField': 'number',
    'DecimalField': 'currency',
    'FloatField': 'number',
    'BooleanField': 'checkbox',
    'DateField': 'date',
    'DateTimeField': 'datetime',
    'ForeignKey': 'reference',
    'ManyToManyField': 'reference_list',
    'ChoiceField': 'choice',
  };
  
  return typeMap[fieldType] || 'text';
}

// Get display value for reference fields
export function getDisplayValueForReference(
  value: unknown, 
  column: CustomColumnDef<Row>, 
  referenceData?: Record<string, unknown>[]
): string {
  if (!value) return '';
  
  if (column.type === 'reference' && referenceData) {
    const referencedItem = referenceData.find(item => item.id === value);
    if (referencedItem) {
      const displayField = column.referenceDisplayField || 'name';
      return referencedItem[displayField] || referencedItem.id?.toString() || '';
    }
  }
  
  return value?.toString() || '';
}

// Validate field value based on column type and constraints
export function validateFieldValue(
  value: unknown, 
  column: CustomColumnDef<Row>
): { isValid: boolean; error?: string } {
  
  // Check required fields
  if (column.isRequired && (value === null || value === undefined || value === '')) {
    return { isValid: false, error: `${column.header} is required` };
  }
  
  // Type-specific validation
  switch (column.type) {
    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { isValid: false, error: 'Invalid email format' };
      }
      break;
      
    case 'number':
    case 'currency':
      if (value && isNaN(Number(value))) {
        return { isValid: false, error: 'Must be a valid number' };
      }
      break;
      
    case 'date':
      if (value && isNaN(Date.parse(value))) {
        return { isValid: false, error: 'Invalid date format' };
      }
      break;
      
    case 'choice':
      if (value && column.choices && !column.choices.some(choice => choice.value === value || choice === value)) {
        return { isValid: false, error: 'Invalid choice selection' };
      }
      break;
      
    case 'reference':
      if (value && column.referenceData && !column.referenceData.some(ref => ref.id === value)) {
        return { isValid: false, error: 'Invalid reference selection' };
      }
      break;
  }
  
  return { isValid: true };
}

// Transform backend field value for frontend display
export function transformBackendValue(value: unknown, column: CustomColumnDef<Row>): unknown {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (column.type) {
    case 'currency':
      return typeof value === 'number' ? value.toFixed(2) : value;
      
    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      if (typeof value === 'string' && value.includes('T')) {
        return value.split('T')[0];
      }
      return value;
      
    case 'datetime':
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
      
    case 'checkbox':
      return Boolean(value);
      
    default:
      return value;
  }
}

// Transform frontend value for backend submission
export function transformFrontendValue(value: unknown, column: CustomColumnDef<Row>): unknown {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  switch (column.type) {
    case 'number':
    case 'currency':
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
      
    case 'checkbox':
      return Boolean(value);
      
    case 'date':
    case 'datetime':
      return value; // Keep as string for API
      
    case 'reference':
      // Ensure we send the ID, not the display value
      return typeof value === 'object' && value?.id ? value.id : value;
      
    default:
      return value;
  }
}

// Get relationship data for reference columns
export function buildReferenceChoices(
  referenceData: Record<string, unknown>[],
  displayField: string = 'name'
): { value: unknown; label: string }[] {
  if (!Array.isArray(referenceData)) return [];
  
  return referenceData.map(item => ({
    value: item.id,
    label: item[displayField] || item.name || item.id?.toString() || 'Unknown',
  }));
}

// Handle table-specific data transformations
export function getTableSpecificTransforms(tableName: string) {
  const transforms: Record<string, Record<string, unknown>> = {
    products: {
      // Add supplier name from reference
      transformRow: (row: Record<string, unknown>, allData: { suppliers?: Supplier[] }) => {
        if (row.supplier && allData.suppliers) {
          const supplier = allData.suppliers.find(s => s.id === row.supplier);
          return { ...row, supplier_name: supplier?.name || '' };
        }
        return row;
      },
    },
    
    orders: {
      // Add customer name from reference
      transformRow: (row: Record<string, unknown>, allData: { customers?: Customer[] }) => {
        if (row.customer && allData.customers) {
          const customer = allData.customers.find(c => c.id === row.customer);
          return { ...row, customer_name: customer?.name || '' };
        }
        return row;
      },
    },
    
    inventory: {
      // Add product and warehouse names from references
      transformRow: (row: Record<string, unknown>, allData: { products?: Product[], warehouses?: Warehouse[] }) => {
        let transformedRow = { ...row };
        
        if (row.product && allData.products) {
          const product = allData.products.find(p => p.id === row.product);
          transformedRow = { ...transformedRow, product_name: product?.name || '' };
        }
        
        if (row.warehouse && allData.warehouses) {
          const warehouse = allData.warehouses.find(w => w.id === row.warehouse);
          transformedRow = { ...transformedRow, warehouse_name: warehouse?.name || '' };
        }
        
        return transformedRow;
      },
    },
    
    shipments: {
      // Add order details from reference
      transformRow: (row: Record<string, unknown>, allData: { orders?: Order[] }) => {
        if (row.order && allData.orders) {
          const order = allData.orders.find(o => o.id === row.order);
          return { ...row, order_details: order ? `Order #${order.id}` : '' };
        }
        return row;
      },
    },
  };
  
  return transforms[tableName] || {};
}

// Bulk validation for multiple rows
export function validateRows(
  rows: Row[], 
  columns: CustomColumnDef<Row>[]
): { isValid: boolean; errors: { rowIndex: number; columnId: string; error: string }[] } {
  const errors: { rowIndex: number; columnId: string; error: string }[] = [];
  
  rows.forEach((row, rowIndex) => {
    columns.forEach(column => {
      if (column.accessorKey) {
        const value = row[column.accessorKey];
        const validation = validateFieldValue(value, column);
        
        if (!validation.isValid && validation.error) {
          errors.push({
            rowIndex,
            columnId: column.accessorKey,
            error: validation.error,
          });
        }
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Generate sample data for new rows
export function generateSampleRowData(tableName: string): Partial<Row> {
  const sampleData: Record<string, Partial<Row>> = {
    suppliers: {
      name: 'New Supplier',
      email: 'supplier@example.com',
    },
    warehouses: {
      name: 'New Warehouse',
      location: 'Location TBD',
    },
    products: {
      name: 'New Product',
      price: 0,
      stock_quantity: 0,
    },
    customers: {
      name: 'New Customer',
      email: 'customer@example.com',
    },
    orders: {
      order_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      total_amount: 0,
    },
    inventory: {
      quantity: 0,
    },
    shipments: {
      status: 'pending',
      shipped_date: new Date().toISOString().split('T')[0],
    },
  };
  
  return sampleData[tableName] || {};
}