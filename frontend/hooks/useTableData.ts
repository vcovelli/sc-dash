import { useState, useEffect, useCallback, useRef } from 'react';
import tableAPI, { TableAPIError, APIResponse } from '@/lib/tableAPI';
import { Row, CustomColumnDef } from '@/app/(authenticated)/relational-ui/components/Sheet';

interface UseTableDataOptions {
  tableName: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableOptimisticUpdates?: boolean;
}

interface TableDataState<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  permissions: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseTableDataReturn<T = any> {
  state: TableDataState<T>;
  actions: {
    refresh: () => Promise<void>;
    createRecord: (data: Partial<T>) => Promise<T | null>;
    updateRecord: (id: number, data: Partial<T>) => Promise<T | null>;
    deleteRecord: (id: number) => Promise<boolean>;
    bulkUpdate: (updates: { id: number; data: Partial<T> }[]) => Promise<T[]>;
    bulkCreate: (records: Partial<T>[]) => Promise<T[]>;
    bulkDelete: (ids: number[]) => Promise<boolean>;
    loadMore: () => Promise<void>;
    search: (query: string) => Promise<void>;
    filter: (filters: Record<string, any>) => Promise<void>;
    sort: (field: string, direction: 'asc' | 'desc') => Promise<void>;
  };
  utils: {
    getRecord: (id: number) => T | undefined;
    isLoading: boolean;
    hasError: boolean;
    canPerformAction: (action: 'create' | 'update' | 'delete') => boolean;
  };
}

export function useTableData<T = any>({
  tableName,
  autoRefresh = false,
  refreshInterval = 30000,
  enableOptimisticUpdates = true,
}: UseTableDataOptions): UseTableDataReturn<T> {
  
  const [state, setState] = useState<TableDataState<T>>({
    data: [],
    loading: true,
    error: null,
    permissions: {
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    },
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [currentParams, setCurrentParams] = useState<Record<string, any>>({});
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<TableDataState<T>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check permissions
  const checkPermissions = useCallback(async () => {
    try {
      const [canRead, canCreate, canUpdate, canDelete] = await Promise.all([
        tableAPI.checkPermissions(tableName, 'read'),
        tableAPI.checkPermissions(tableName, 'create'),
        tableAPI.checkPermissions(tableName, 'update'),
        tableAPI.checkPermissions(tableName, 'delete'),
      ]);

      updateState({
        permissions: { canRead, canCreate, canUpdate, canDelete }
      });
    } catch (error) {
      console.warn('Failed to check permissions:', error);
      // Default to read-only if permission check fails
      updateState({
        permissions: { canRead: true, canCreate: false, canUpdate: false, canDelete: false }
      });
    }
  }, [tableName, updateState]);

  // Load data from API
  const loadData = useCallback(async (params: Record<string, any> = {}) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    updateState({ loading: true, error: null });

    try {
      const response: APIResponse<T> = await tableAPI.getTableData<T>(tableName, params);
      
      updateState({
        data: response.results,
        totalCount: response.count,
        hasNextPage: !!response.next,
        hasPreviousPage: !!response.previous,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to load ${tableName} data`;
      
      updateState({
        error: errorMessage,
        loading: false,
      });
    } finally {
      isLoadingRef.current = false;
    }
  }, [tableName, updateState]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData(currentParams);
  }, [loadData, currentParams]);

  // Create record
  const createRecord = useCallback(async (data: Partial<T>): Promise<T | null> => {
    if (!state.permissions.canCreate) {
      updateState({ error: 'You do not have permission to create records' });
      return null;
    }

    try {
      const newRecord = await tableAPI.createTableRecord<T>(tableName, data);
      
      if (enableOptimisticUpdates) {
        updateState({
          data: [...state.data, newRecord],
          totalCount: state.totalCount + 1,
        });
      } else {
        await refresh();
      }
      
      return newRecord;
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to create ${tableName} record`;
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [tableName, state.permissions.canCreate, state.data, state.totalCount, enableOptimisticUpdates, updateState, refresh]);

  // Update record
  const updateRecord = useCallback(async (id: number, data: Partial<T>): Promise<T | null> => {
    if (!state.permissions.canUpdate) {
      updateState({ error: 'You do not have permission to update records' });
      return null;
    }

    // Optimistic update
    let originalData: T[] = [];
    if (enableOptimisticUpdates) {
      originalData = [...state.data];
      const optimisticData = state.data.map(item => 
        (item as any).id === id ? { ...item, ...data } : item
      );
      updateState({ data: optimisticData });
    }

    try {
      const updatedRecord = await tableAPI.updateTableRecord<T>(tableName, id, data);
      
      if (!enableOptimisticUpdates) {
        await refresh();
      } else {
        // Replace optimistic update with real data
        const finalData = state.data.map(item => 
          (item as any).id === id ? updatedRecord : item
        );
        updateState({ data: finalData });
      }
      
      return updatedRecord;
    } catch (error) {
      // Revert optimistic update on error
      if (enableOptimisticUpdates) {
        updateState({ data: originalData });
      }
      
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to update ${tableName} record`;
      
      updateState({ error: errorMessage });
      return null;
    }
  }, [tableName, state.permissions.canUpdate, state.data, enableOptimisticUpdates, updateState, refresh]);

  // Delete record
  const deleteRecord = useCallback(async (id: number): Promise<boolean> => {
    if (!state.permissions.canDelete) {
      updateState({ error: 'You do not have permission to delete records' });
      return false;
    }

    // Optimistic update
    let originalData: T[] = [];
    if (enableOptimisticUpdates) {
      originalData = [...state.data];
      const optimisticData = state.data.filter(item => (item as any).id !== id);
      updateState({ 
        data: optimisticData,
        totalCount: state.totalCount - 1,
      });
    }

    try {
      await tableAPI.deleteTableRecord(tableName, id);
      
      if (!enableOptimisticUpdates) {
        await refresh();
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      if (enableOptimisticUpdates) {
        updateState({ 
          data: originalData,
          totalCount: state.totalCount,
        });
      }
      
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to delete ${tableName} record`;
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [tableName, state.permissions.canDelete, state.data, state.totalCount, enableOptimisticUpdates, updateState, refresh]);

  // Bulk operations
  const bulkUpdate = useCallback(async (updates: { id: number; data: Partial<T> }[]): Promise<T[]> => {
    if (!state.permissions.canUpdate) {
      updateState({ error: 'You do not have permission to update records' });
      return [];
    }

    try {
      const updatedRecords = await tableAPI.bulkUpdate<T>(tableName, updates);
      await refresh(); // Always refresh after bulk operations
      return updatedRecords;
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to bulk update ${tableName} records`;
      
      updateState({ error: errorMessage });
      return [];
    }
  }, [tableName, state.permissions.canUpdate, updateState, refresh]);

  const bulkCreate = useCallback(async (records: Partial<T>[]): Promise<T[]> => {
    if (!state.permissions.canCreate) {
      updateState({ error: 'You do not have permission to create records' });
      return [];
    }

    try {
      const newRecords = await tableAPI.bulkCreate<T>(tableName, records);
      await refresh(); // Always refresh after bulk operations
      return newRecords;
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to bulk create ${tableName} records`;
      
      updateState({ error: errorMessage });
      return [];
    }
  }, [tableName, state.permissions.canCreate, updateState, refresh]);

  const bulkDelete = useCallback(async (ids: number[]): Promise<boolean> => {
    if (!state.permissions.canDelete) {
      updateState({ error: 'You do not have permission to delete records' });
      return false;
    }

    try {
      await tableAPI.bulkDelete(tableName, ids);
      await refresh();
      return true;
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to bulk delete ${tableName} records`;
      
      updateState({ error: errorMessage });
      return false;
    }
  }, [tableName, state.permissions.canDelete, updateState, refresh]);

  // Search, filter, sort
  const search = useCallback(async (query: string) => {
    const params = { ...currentParams, search: query };
    setCurrentParams(params);
    await loadData(params);
  }, [currentParams, loadData]);

  const filter = useCallback(async (filters: Record<string, any>) => {
    const params = { ...currentParams, ...filters };
    setCurrentParams(params);
    await loadData(params);
  }, [currentParams, loadData]);

  const sort = useCallback(async (field: string, direction: 'asc' | 'desc') => {
    const ordering = direction === 'desc' ? `-${field}` : field;
    const params = { ...currentParams, ordering };
    setCurrentParams(params);
    await loadData(params);
  }, [currentParams, loadData]);

  const loadMore = useCallback(async () => {
    if (!state.hasNextPage) return;
    
    const params = { 
      ...currentParams, 
      offset: state.data.length 
    };
    
    try {
      const response: APIResponse<T> = await tableAPI.getTableData<T>(tableName, params);
      updateState({
        data: [...state.data, ...response.results],
        hasNextPage: !!response.next,
        hasPreviousPage: !!response.previous,
      });
    } catch (error) {
      const errorMessage = error instanceof TableAPIError 
        ? error.message 
        : `Failed to load more ${tableName} data`;
      
      updateState({ error: errorMessage });
    }
  }, [tableName, state.hasNextPage, state.data, currentParams, updateState]);

  // Utility functions
  const getRecord = useCallback((id: number): T | undefined => {
    return state.data.find(item => (item as any).id === id);
  }, [state.data]);

  const canPerformAction = useCallback((action: 'create' | 'update' | 'delete'): boolean => {
    const permissionMap = {
      create: state.permissions.canCreate,
      update: state.permissions.canUpdate,
      delete: state.permissions.canDelete,
    };
    return permissionMap[action];
  }, [state.permissions]);

  // Initial load and setup
  useEffect(() => {
    checkPermissions();
    loadData();
  }, [tableName, checkPermissions, loadData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const setupRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        refresh();
        setupRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    setupRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      refresh,
      createRecord,
      updateRecord,
      deleteRecord,
      bulkUpdate,
      bulkCreate,
      bulkDelete,
      loadMore,
      search,
      filter,
      sort,
    },
    utils: {
      getRecord,
      isLoading: state.loading,
      hasError: !!state.error,
      canPerformAction,
    },
  };
}