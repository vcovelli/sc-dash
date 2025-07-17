"use client";
import React, { useState, useEffect, useCallback } from "react";
import RelationalWorkspaceLayout from "@/app/(authenticated)/relational-ui/components/Sheet/RelationalWorkspaceLayout";
import GridTable from "@/app/(authenticated)/relational-ui/components/Grid/GridTable";
import ColumnSettingsPanel from "@/app/(authenticated)/relational-ui/components/UX/ColumnSettingsPanel";
import { CustomColumnDef, Row, Option } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { useNavContext } from "@/components/nav/NavbarContext";
import TableSelectorPanel from "@/app/(authenticated)/relational-ui/components/UX/TableSelectorPanel";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import { enrichSchemaWithReferenceData } from "@/app/(authenticated)/relational-ui/components/Grid/enrichSchema";
import { generateEmptyRow } from "@/app/(authenticated)/relational-ui/components/Grid/generateEmptyRow";
import { useTableData } from "@/hooks/useTableData";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";

const PANEL_WIDTH = 320;
const availableTables = ["orders", "products", "customers", "suppliers", "warehouses", "inventory", "shipments"];

// Column definitions for each table type
const defaultColumnDefs: Record<string, CustomColumnDef<Row>[]> = {
  suppliers: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "name", accessorKey: "name", header: "Supplier Name", type: "text", width: 200, isVisible: true, isEditable: true },
    { id: "contact_name", accessorKey: "contact_name", header: "Contact Name", type: "text", width: 150, isVisible: true, isEditable: true },
    { id: "email", accessorKey: "email", header: "Email", type: "email", width: 200, isVisible: true, isEditable: true },
    { id: "phone", accessorKey: "phone", header: "Phone", type: "text", width: 120, isVisible: true, isEditable: true },
    { id: "address", accessorKey: "address", header: "Address", type: "text", width: 250, isVisible: true, isEditable: true },
  ],
  warehouses: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "name", accessorKey: "name", header: "Warehouse Name", type: "text", width: 200, isVisible: true, isEditable: true },
    { id: "location", accessorKey: "location", header: "Location", type: "text", width: 250, isVisible: true, isEditable: true },
  ],
  products: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "name", accessorKey: "name", header: "Product Name", type: "text", width: 200, isVisible: true, isEditable: true },
    { id: "description", accessorKey: "description", header: "Description", type: "text", width: 250, isVisible: true, isEditable: true },
    { id: "price", accessorKey: "price", header: "Price", type: "currency", width: 120, isVisible: true, isEditable: true },
    { id: "stock_quantity", accessorKey: "stock_quantity", header: "Stock", type: "number", width: 100, isVisible: true, isEditable: true },
    { id: "supplier", accessorKey: "supplier", header: "Supplier", type: "reference", referenceTable: "suppliers", referenceDisplayField: "name", width: 150, isVisible: true, isEditable: true },
  ],
  customers: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "name", accessorKey: "name", header: "Customer Name", type: "text", width: 200, isVisible: true, isEditable: true },
    { id: "email", accessorKey: "email", header: "Email", type: "email", width: 200, isVisible: true, isEditable: true },
    { id: "phone", accessorKey: "phone", header: "Phone", type: "text", width: 120, isVisible: true, isEditable: true },
    { id: "address", accessorKey: "address", header: "Address", type: "text", width: 250, isVisible: true, isEditable: true },
  ],
  orders: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "customer", accessorKey: "customer", header: "Customer", type: "reference", referenceTable: "customers", referenceDisplayField: "name", width: 150, isVisible: true, isEditable: true },
    { id: "order_date", accessorKey: "order_date", header: "Order Date", type: "date", width: 120, isVisible: true, isEditable: true },
    { id: "status", accessorKey: "status", header: "Status", type: "choice", choices: ["pending", "processing", "shipped", "delivered", "cancelled"], width: 120, isVisible: true, isEditable: true },
    { id: "total_amount", accessorKey: "total_amount", header: "Total Amount", type: "currency", width: 120, isVisible: true, isEditable: true },
  ],
  inventory: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "product", accessorKey: "product", header: "Product", type: "reference", referenceTable: "products", referenceDisplayField: "name", width: 200, isVisible: true, isEditable: true },
    { id: "warehouse", accessorKey: "warehouse", header: "Warehouse", type: "reference", referenceTable: "warehouses", referenceDisplayField: "name", width: 150, isVisible: true, isEditable: true },
    { id: "quantity", accessorKey: "quantity", header: "Quantity", type: "number", width: 100, isVisible: true, isEditable: true },
  ],
  shipments: [
    { id: "id", accessorKey: "id", header: "ID", type: "number", width: 80, isVisible: true, isEditable: false },
    { id: "order", accessorKey: "order", header: "Order", type: "reference", referenceTable: "orders", referenceDisplayField: "id", width: 100, isVisible: true, isEditable: true },
    { id: "tracking_number", accessorKey: "tracking_number", header: "Tracking Number", type: "text", width: 150, isVisible: true, isEditable: true },
    { id: "carrier", accessorKey: "carrier", header: "Carrier", type: "text", width: 120, isVisible: true, isEditable: true },
    { id: "shipped_date", accessorKey: "shipped_date", header: "Shipped Date", type: "date", width: 120, isVisible: true, isEditable: true },
    { id: "delivered_date", accessorKey: "delivered_date", header: "Delivered Date", type: "date", width: 120, isVisible: true, isEditable: true },
    { id: "status", accessorKey: "status", header: "Status", type: "choice", choices: ["pending", "shipped", "in_transit", "delivered"], width: 120, isVisible: true, isEditable: true },
  ],
};

const activeBtn = "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600";
const inactiveBtn = "bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-blue-950 dark:hover:text-blue-200 dark:hover:border-blue-400";
const baseBtn = "px-3 py-1 rounded border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

function MobileRotatePrompt() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      const isMobile =
        window.innerWidth <= 600 &&
        /Android|iPhone|iPod|iOS/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      setShow(isMobile && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm text-center">
        <div className="text-6xl mb-4">📱↻</div>
        <h3 className="text-lg font-semibold mb-2 dark:text-white">
          Better Experience in Landscape
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Please rotate your device to landscape mode for the best spreadsheet experience.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Error Loading Data</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function LoadingDisplay() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading data...</p>
      </div>
    </div>
  );
}

function EmptyStateDisplay({ tableName, onAddData }: { tableName: string; onAddData: () => void }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold mb-2 dark:text-white">No {tableName} data found</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Get started by adding some {tableName} data to see the relational spreadsheet in action.
        </p>
        <div className="space-y-3">
          <button
            onClick={onAddData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Add First {tableName.slice(0, -1).charAt(0).toUpperCase() + tableName.slice(0, -1).slice(1)}
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>💡 <strong>Tip:</strong> You can also set up test data by running:</p>
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
              python manage.py setup_relational_test_data
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SheetsPageInner() {
  const { profile, loading: profileLoading } = useProfile();
  const { setIsSidebarOpen } = useNavContext();
  const { fontSizeIdx, setFontSizeIdx, presets } = useTableSettings();
  const router = useRouter();

  const [activeTableName, setActiveTableName] = useState("suppliers");
  const [columns, setColumns] = useState<CustomColumnDef<Row>[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<CustomColumnDef<Row> | null>(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);

  // Use the table data hook for CRUD operations
  const {
    state: { data, loading, error, permissions },
    actions: { refresh, createRecord, updateRecord, deleteRecord, bulkUpdate },
    utils: { canPerformAction, hasError }
  } = useTableData({
    tableName: activeTableName,
    autoRefresh: true,
    refreshInterval: 30000,
    enableOptimisticUpdates: true,
  });

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    if (!profile && !profileLoading) {
      router.push("/login");
      return;
    }
  }, [profile, profileLoading, router]);

  // Update columns and rows when table changes or data loads
  useEffect(() => {
    const loadTableStructure = async () => {
      if (!activeTableName) return;

      try {
        // Get default column definitions for the table
        const defaultCols = defaultColumnDefs[activeTableName] || [];
        const enrichedCols = await enrichSchemaWithReferenceData(defaultCols);
        setColumns(enrichedCols);

        // Transform API data to match Row format
        const transformedRows = data.length > 0 
          ? data.map((record: Record<string, unknown>) => ({ 
              ...record, 
              __rowId: (typeof record.id === 'number' ? record.id : Math.floor(Math.random() * 10000))
            }))
          : [];
        
        setRows(transformedRows);
      } catch (error) {
        console.error("Error setting up table structure:", error);
      }
    };

    loadTableStructure();
  }, [activeTableName, data]);

  // Add new options to both choice and reference columns
  const columnsWithAdders = columns.map(col => {
    if (["choice", "choice_list"].includes(col.type?.toLowerCase?.())) {
      const existingChoices = normalizeChoices(col.choices);  // <--- normalize!
      const addNewOption: Option = {
        id: "__ADD_NEW__",
        name: "+ Add new choice",
        isAddNew: true,
      };
      return {
        ...col,
        choices: [...existingChoices, addNewOption],  // now always Option[]
      };
    }

    if (col.type?.toLowerCase?.() === "reference" && col.referenceTable) {
      // Optionally normalize referenceData if you use it similarly
      return col;
    }

    return col;
  });

  // Handle cell updates with proper API calls
  const handleCellUpdate = async (rowIndex: number, columnId: string, newValue: unknown) => {
    if (!canPerformAction('update')) {
      console.error('No permission to update records');
      return;
    }

    const row = rows[rowIndex];
    const rowId = typeof row.id === "number" ? row.id : row.__rowId;
    if (!rowId) {
      console.error('Cannot update row without ID');
      return;
    }
    const updatedRecord = await updateRecord(rowId, { [columnId]: newValue });
    if (updatedRecord) {
      // Update local state
      const updatedRows = [...rows];
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], [columnId]: newValue };
      setRows(updatedRows);
    }
  };

  // Handle adding new rows
  const handleAddRow = async () => {
    if (!canPerformAction('create')) {
      console.error('No permission to create records');
      return;
    }

    const emptyRow = generateEmptyRow(columns);
    const newRecord = await createRecord(emptyRow);
    
    if (newRecord) {
      setRows([...rows, newRecord]);
    }
  };

  // Handle deleting rows
  const handleDeleteRow = async (rowIndex: number) => {
    if (!canPerformAction('delete')) {
      console.error('No permission to delete records');
      return;
    }

    const row = rows[rowIndex];
    const rowId = typeof row.id === "number" ? row.id : row.__rowId;
    if (!rowId) {
      console.error('Cannot delete row without ID');
      return;
    }
    const success = await deleteRecord(rowId);
    if (success) {
      const updatedRows = rows.filter((_, index) => index !== rowIndex);
      setRows(updatedRows);
    }
  };

  // Update table function for GridTable
  const onUpdateTable = useCallback(
    async (name: string, updated: { columns: CustomColumnDef<Row>[]; data: Row[] }) => {
      // Handle bulk updates if needed
      const changedRows = updated.data.filter((row, index) => {
        const originalRow = rows[index];
        return originalRow && JSON.stringify(row) !== JSON.stringify(originalRow);
      });

      if (changedRows.length > 0 && canPerformAction('update')) {
        const updates = changedRows
          .filter(row => typeof row.id === "number")
          .map(row => ({
            id: row.id as number,
            data: row
          }));
        
        if (updates.length > 0) {
          await bulkUpdate(updates);
        }
      }

      setColumns(updated.columns);
      setRows(updated.data);
    },
    [rows, canPerformAction, bulkUpdate]
  );

  // Other handlers
  const onRenameColumn = (accessorKey: string, newHeader: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.accessorKey === accessorKey ? { ...col, header: newHeader } : col
      )
    );
  };

  const onReorderColumns = (newColumns: CustomColumnDef<Row>[]) => {
    setColumns(newColumns);
  };

  const onAddColumn = (newCol: CustomColumnDef<Row>) => {
    setColumns(prev => [...prev, newCol]);
  };

  const onDeleteColumn = (accessorKey: string) => {
    setColumns(prev => prev.filter(col => col.accessorKey !== accessorKey));
  };

  const onOpenSettingsPanel = (col: CustomColumnDef<Row>) => {
    setSelectedColumn(col);
    setIsSettingsPanelOpen(true);
  };

  if (!profile) {
    return <LoadingDisplay />;
  }

  if (hasError && error) {
    return <ErrorDisplay error={error} onRetry={refresh} />;
  }

  const isProUser = true; // or false, or pull from your user profile

  const handleAddTable = () => { 
    alert("Add Table clicked (coming soon!)");
  };

  function normalizeChoices(choices?: string[] | Option[]): Option[] {
    if (!choices) return [];
    if (typeof choices[0] === "string") {
      return (choices as string[]).map(s => ({ id: s, name: s }));
    }
    return choices as Option[];
  }

  return (
    <RelationalWorkspaceLayout>
      <MobileRotatePrompt />
      
      {/* Main content area */}
      <div className="flex h-full">
        {/* Table selector panel */}
        {isTableSelectorOpen && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <TableSelectorPanel
              isOpen={isTableSelectorOpen} 
              tables={availableTables}
              activeTable={activeTableName}
              onSelectTable={(tableName) => {
                setActiveTableName(tableName);
                setIsTableSelectorOpen(false);
              }}
              onClose={() => setIsTableSelectorOpen(false)}
              isProUser={isProUser}
              onAddTable={handleAddTable}
            />
          </div>
        )}

        {/* Main spreadsheet area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with table selector and controls */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsTableSelectorOpen(!isTableSelectorOpen)}
                  className={`${baseBtn} ${isTableSelectorOpen ? activeBtn : inactiveBtn}`}
                >
                  📊 Tables
                </button>
                
                <div className="flex items-center space-x-2">
                  {availableTables.map((tableName) => (
                    <button
                      key={tableName}
                      onClick={() => setActiveTableName(tableName)}
                      className={`${baseBtn} ${
                        activeTableName === tableName ? activeBtn : inactiveBtn
                      }`}
                    >
                      {tableName.charAt(0).toUpperCase() + tableName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Permission indicators */}
                <div className="flex items-center space-x-2 text-xs">
                  {permissions.canCreate && <span className="text-green-600">✓ Create</span>}
                  {permissions.canUpdate && <span className="text-blue-600">✓ Edit</span>}
                  {permissions.canDelete && <span className="text-red-600">✓ Delete</span>}
                </div>

                <button
                  onClick={refresh}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm"
                >
                  {loading ? "↻" : "🔄"} Refresh
                </button>
                
                {canPerformAction('create') && (
                  <button
                    onClick={handleAddRow}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    + Add Row
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spreadsheet grid */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <LoadingDisplay />
            ) : rows.length === 0 ? (
              <EmptyStateDisplay tableName={activeTableName} onAddData={handleAddRow} />
            ) : (
              <GridTable
                tableName={activeTableName}
                columns={columnsWithAdders}
                data={rows}
                onOpenSettingsPanel={onOpenSettingsPanel}
                isSettingsPanelOpen={isSettingsPanelOpen}
                onUpdateTable={onUpdateTable}
                onRenameColumn={onRenameColumn}
                onReorderColumns={onReorderColumns}
                onAddColumn={onAddColumn}
                onDeleteColumn={onDeleteColumn}
                onCellUpdate={handleCellUpdate}
                onDeleteRow={handleDeleteRow}
                permissions={permissions}
              />
            )}
          </div>
        </div>

        {/* Column settings panel */}
        {isSettingsPanelOpen && selectedColumn && (
          <div
            className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto"
            style={{ width: PANEL_WIDTH }}
          >
            <ColumnSettingsPanel
              isOpen={isSettingsPanelOpen}
              column={selectedColumn}
              onClose={() => setIsSettingsPanelOpen(false)}
              presets={presets}
              fontSizeIdx={fontSizeIdx}
              setFontSizeIdx={setFontSizeIdx}
              onUpdate={(updatedColumn) => {
                setColumns(prev =>
                  prev.map(col =>
                    col.id === updatedColumn.id ? updatedColumn : col
                  )
                );
              }}
            />
          </div>
        )}
      </div>
    </RelationalWorkspaceLayout>
  );
}
