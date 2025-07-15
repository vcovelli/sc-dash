// API service layer for relational spreadsheet
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

// Types for API responses
export interface SchemaResponse {
  id: number;
  table_name: string;
  columns: any[];
  sharing_level: string;
  is_valid: boolean;
  version: number;
  user: number;
  org: number;
}

export interface RowResponse {
  id: number;
  table_name: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ColumnResponse {
  id: number;
  name: string;
  display_name: string;
  data_type: string;
  order: number;
  is_required: boolean;
  is_unique: boolean;
  is_visible: boolean;
  is_editable: boolean;
  choices?: any[];
  foreign_key_table?: string;
  foreign_key_column?: string;
}

class APIError extends Error {
  constructor(public status: number, message: string, public response?: any) {
    super(message);
    this.name = 'APIError';
  }
}

class RelationalAPI {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.initializeAuth();
  }

  private initializeAuth() {
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = await response.text() || errorMessage;
        }
        throw new APIError(response.status, errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Authentication methods
  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearAuth() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  // Schema Management
  async getSchemas(): Promise<SchemaResponse[]> {
    return this.request<SchemaResponse[]>('/api/datagrid/v2/schemas/');
  }

  async getSchema(schemaId: number): Promise<SchemaResponse> {
    return this.request<SchemaResponse>(`/api/datagrid/v2/schemas/${schemaId}/`);
  }

  async createSchema(schemaData: {
    table_name: string;
    description?: string;
    sharing_level?: 'private' | 'org' | 'public';
    columns: any[];
  }): Promise<SchemaResponse> {
    return this.request<SchemaResponse>('/api/datagrid/v2/schemas/', {
      method: 'POST',
      body: JSON.stringify(schemaData),
    });
  }

  async updateSchema(schemaId: number, schemaData: Partial<SchemaResponse>): Promise<SchemaResponse> {
    return this.request<SchemaResponse>(`/api/datagrid/v2/schemas/${schemaId}/`, {
      method: 'PATCH',
      body: JSON.stringify(schemaData),
    });
  }

  async deleteSchema(schemaId: number): Promise<void> {
    return this.request<void>(`/api/datagrid/v2/schemas/${schemaId}/`, {
      method: 'DELETE',
    });
  }

  // Column Management
  async getSchemaColumns(schemaId: number): Promise<ColumnResponse[]> {
    return this.request<ColumnResponse[]>(`/api/datagrid/v2/schemas/${schemaId}/columns/`);
  }

  async createColumn(schemaId: number, columnData: {
    name: string;
    display_name?: string;
    data_type: string;
    is_required?: boolean;
    is_unique?: boolean;
    choices?: any[];
    foreign_key_table?: string;
    foreign_key_column?: string;
  }): Promise<ColumnResponse> {
    return this.request<ColumnResponse>(`/api/datagrid/v2/schemas/${schemaId}/columns/`, {
      method: 'POST',
      body: JSON.stringify(columnData),
    });
  }

  async updateColumn(schemaId: number, columnId: number, columnData: Partial<ColumnResponse>): Promise<ColumnResponse> {
    return this.request<ColumnResponse>(`/api/datagrid/v2/schemas/${schemaId}/columns/${columnId}/`, {
      method: 'PATCH',
      body: JSON.stringify(columnData),
    });
  }

  async deleteColumn(schemaId: number, columnId: number): Promise<void> {
    return this.request<void>(`/api/datagrid/v2/schemas/${schemaId}/columns/${columnId}/`, {
      method: 'DELETE',
    });
  }

  async reorderColumns(schemaId: number, columnOrders: { id: number; order: number }[]): Promise<void> {
    return this.request<void>(`/api/datagrid/v2/schemas/${schemaId}/columns/reorder/`, {
      method: 'POST',
      body: JSON.stringify({ column_orders: columnOrders }),
    });
  }

  // Row Data Management
  async getTableRows(tableName: string): Promise<RowResponse[]> {
    return this.request<RowResponse[]>(`/api/datagrid/rows/${tableName}/`);
  }

  async createRow(tableName: string, data: Record<string, any>): Promise<RowResponse> {
    return this.request<RowResponse>(`/api/datagrid/rows/${tableName}/`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async updateRow(tableName: string, rowId: number, data: Record<string, any>): Promise<RowResponse> {
    return this.request<RowResponse>(`/api/datagrid/rows/${tableName}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    });
  }

  async updateRowField(tableName: string, rowId: number, fieldName: string, value: any): Promise<RowResponse> {
    return this.request<RowResponse>(`/api/datagrid/rows/${tableName}/${rowId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ data: { [fieldName]: value } }),
    });
  }

  async deleteRow(tableName: string, rowId: number): Promise<void> {
    return this.request<void>(`/api/datagrid/rows/${tableName}/${rowId}/`, {
      method: 'DELETE',
    });
  }

  // Schema Sharing and Permissions
  async shareSchema(schemaId: number, shareData: {
    sharing_level?: 'private' | 'org' | 'public';
    user_permissions?: { user_id: number; permission: string }[];
    org_permissions?: { org_id: number; permission: string }[];
  }): Promise<any> {
    return this.request<any>(`/api/datagrid/v2/schemas/${schemaId}/share/`, {
      method: 'POST',
      body: JSON.stringify(shareData),
    });
  }

  async getSharedSchemas(): Promise<SchemaResponse[]> {
    return this.request<SchemaResponse[]>('/api/datagrid/schemas/shared/');
  }

  // Validation
  async validateSchema(schemaId: number): Promise<{ is_valid: boolean; errors: string[] }> {
    return this.request<{ is_valid: boolean; errors: string[] }>(`/api/datagrid/v2/schemas/${schemaId}/validate/`);
  }

  // Feature-based schema loading (for backward compatibility)
  async getFeatureSchema(featureName: string): Promise<any> {
    return this.request<any>(`/api/datagrid/schemas/features/${featureName}/`);
  }
}

// Export singleton instance
export const api = new RelationalAPI();
export default api;