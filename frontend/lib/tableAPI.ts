import api from './axios';

// Types for the default user tables
export interface Supplier {
  id?: number;
  name: string;
  contact_name?: string;
  phone?: string;
  email: string;
  address?: string;
}

export interface Warehouse {
  id?: number;
  name: string;
  location: string;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  supplier: number;
  supplier_name?: string;
  client_id?: string;
}

export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Order {
  id?: number;
  customer: number;
  customer_name?: string;
  order_date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id?: number;
  order: number;
  product: number;
  product_name?: string;
  quantity: number;
  price: number;
}

export interface Inventory {
  id?: number;
  product: number;
  warehouse: number;
  quantity: number;
}

export interface Shipment {
  id?: number;
  order: number;
  tracking_number?: string;
  carrier?: string;
  shipped_date?: string;
  delivered_date?: string;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered';
}

// Generic API response type
export interface APIResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Error handling
export class TableAPIError extends Error {
  constructor(public status: number, message: string, public detail?: any) {
    super(message);
    this.name = 'TableAPIError';
  }
}

// Generic CRUD operations for all table types
class TableAPI {
  
  // Generic methods that work with any table
  async getTableData<T>(tableName: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    try {
      const response = await api.get(`/${tableName}/`, { params });
      return response.data;
    } catch (error: any) {
      throw new TableAPIError(
        error.response?.status || 500,
        error.response?.data?.detail || `Failed to fetch ${tableName}`,
        error.response?.data
      );
    }
  }

  async createTableRecord<T>(tableName: string, data: Partial<T>): Promise<T> {
    try {
      const response = await api.post(`/${tableName}/`, data);
      return response.data;
    } catch (error: any) {
      throw new TableAPIError(
        error.response?.status || 500,
        error.response?.data?.detail || `Failed to create ${tableName} record`,
        error.response?.data
      );
    }
  }

  async updateTableRecord<T>(tableName: string, id: number, data: Partial<T>): Promise<T> {
    try {
      const response = await api.patch(`/${tableName}/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw new TableAPIError(
        error.response?.status || 500,
        error.response?.data?.detail || `Failed to update ${tableName} record`,
        error.response?.data
      );
    }
  }

  async deleteTableRecord(tableName: string, id: number): Promise<void> {
    try {
      await api.delete(`/${tableName}/${id}/`);
    } catch (error: any) {
      throw new TableAPIError(
        error.response?.status || 500,
        error.response?.data?.detail || `Failed to delete ${tableName} record`,
        error.response?.data
      );
    }
  }

  async getTableRecord<T>(tableName: string, id: number): Promise<T> {
    try {
      const response = await api.get(`/${tableName}/${id}/`);
      return response.data;
    } catch (error: any) {
      throw new TableAPIError(
        error.response?.status || 500,
        error.response?.data?.detail || `Failed to fetch ${tableName} record`,
        error.response?.data
      );
    }
  }

  // Specific methods for each table type
  // Suppliers
  async getSuppliers(params?: Record<string, any>): Promise<APIResponse<Supplier>> {
    return this.getTableData<Supplier>('suppliers', params);
  }

  async createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    return this.createTableRecord<Supplier>('suppliers', data);
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
    return this.updateTableRecord<Supplier>('suppliers', id, data);
  }

  async deleteSupplier(id: number): Promise<void> {
    return this.deleteTableRecord('suppliers', id);
  }

  // Warehouses
  async getWarehouses(params?: Record<string, any>): Promise<APIResponse<Warehouse>> {
    return this.getTableData<Warehouse>('warehouses', params);
  }

  async createWarehouse(data: Omit<Warehouse, 'id'>): Promise<Warehouse> {
    return this.createTableRecord<Warehouse>('warehouses', data);
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
    return this.updateTableRecord<Warehouse>('warehouses', id, data);
  }

  async deleteWarehouse(id: number): Promise<void> {
    return this.deleteTableRecord('warehouses', id);
  }

  // Products
  async getProducts(params?: Record<string, any>): Promise<APIResponse<Product>> {
    return this.getTableData<Product>('products', params);
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    return this.createTableRecord<Product>('products', data);
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    return this.updateTableRecord<Product>('products', id, data);
  }

  async deleteProduct(id: number): Promise<void> {
    return this.deleteTableRecord('products', id);
  }

  // Customers
  async getCustomers(params?: Record<string, any>): Promise<APIResponse<Customer>> {
    return this.getTableData<Customer>('customers', params);
  }

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    return this.createTableRecord<Customer>('customers', data);
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return this.updateTableRecord<Customer>('customers', id, data);
  }

  async deleteCustomer(id: number): Promise<void> {
    return this.deleteTableRecord('customers', id);
  }

  // Orders
  async getOrders(params?: Record<string, any>): Promise<APIResponse<Order>> {
    return this.getTableData<Order>('orders', params);
  }

  async createOrder(data: Omit<Order, 'id'>): Promise<Order> {
    return this.createTableRecord<Order>('orders', data);
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    return this.updateTableRecord<Order>('orders', id, data);
  }

  async deleteOrder(id: number): Promise<void> {
    return this.deleteTableRecord('orders', id);
  }

  // Order Items
  async getOrderItems(params?: Record<string, any>): Promise<APIResponse<OrderItem>> {
    return this.getTableData<OrderItem>('order-items', params);
  }

  async createOrderItem(data: Omit<OrderItem, 'id'>): Promise<OrderItem> {
    return this.createTableRecord<OrderItem>('order-items', data);
  }

  async updateOrderItem(id: number, data: Partial<OrderItem>): Promise<OrderItem> {
    return this.updateTableRecord<OrderItem>('order-items', id, data);
  }

  async deleteOrderItem(id: number): Promise<void> {
    return this.deleteTableRecord('order-items', id);
  }

  // Inventory
  async getInventory(params?: Record<string, any>): Promise<APIResponse<Inventory>> {
    return this.getTableData<Inventory>('inventory', params);
  }

  async createInventoryRecord(data: Omit<Inventory, 'id'>): Promise<Inventory> {
    return this.createTableRecord<Inventory>('inventory', data);
  }

  async updateInventoryRecord(id: number, data: Partial<Inventory>): Promise<Inventory> {
    return this.updateTableRecord<Inventory>('inventory', id, data);
  }

  async deleteInventoryRecord(id: number): Promise<void> {
    return this.deleteTableRecord('inventory', id);
  }

  // Shipments
  async getShipments(params?: Record<string, any>): Promise<APIResponse<Shipment>> {
    return this.getTableData<Shipment>('shipments', params);
  }

  async createShipment(data: Omit<Shipment, 'id'>): Promise<Shipment> {
    return this.createTableRecord<Shipment>('shipments', data);
  }

  async updateShipment(id: number, data: Partial<Shipment>): Promise<Shipment> {
    return this.updateTableRecord<Shipment>('shipments', id, data);
  }

  async deleteShipment(id: number): Promise<void> {
    return this.deleteTableRecord('shipments', id);
  }

  // Bulk operations
  async bulkUpdate<T>(tableName: string, updates: { id: number; data: Partial<T> }[]): Promise<T[]> {
    try {
      const promises = updates.map(update => 
        this.updateTableRecord<T>(tableName, update.id, update.data)
      );
      return await Promise.all(promises);
    } catch (error: any) {
      throw new TableAPIError(
        error.status || 500,
        `Failed to bulk update ${tableName} records`,
        error
      );
    }
  }

  async bulkCreate<T>(tableName: string, records: Partial<T>[]): Promise<T[]> {
    try {
      const promises = records.map(record => 
        this.createTableRecord<T>(tableName, record)
      );
      return await Promise.all(promises);
    } catch (error: any) {
      throw new TableAPIError(
        error.status || 500,
        `Failed to bulk create ${tableName} records`,
        error
      );
    }
  }

  async bulkDelete(tableName: string, ids: number[]): Promise<void> {
    try {
      const promises = ids.map(id => this.deleteTableRecord(tableName, id));
      await Promise.all(promises);
    } catch (error: any) {
      throw new TableAPIError(
        error.status || 500,
        `Failed to bulk delete ${tableName} records`,
        error
      );
    }
  }

  // Permission checking (will check with backend if user has permission)
  async checkPermissions(tableName: string, action: 'read' | 'create' | 'update' | 'delete'): Promise<boolean> {
    try {
      // Use OPTIONS request to check permissions
      const response = await api.options(`/${tableName}/`);
      const allowedMethods = response.headers.allow || '';
      
      const methodMap = {
        read: 'GET',
        create: 'POST',
        update: 'PATCH',
        delete: 'DELETE'
      };
      
      return allowedMethods.includes(methodMap[action]);
    } catch (error) {
      // If we can't check permissions, assume no access
      return false;
    }
  }
}

// Export singleton instance
export const tableAPI = new TableAPI();
export default tableAPI;