"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { buildColumnDefs } from "@/app/(authenticated)/relational-ui/components/Grid/useColumns";
import { Row, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import ContextMenu from "@/app/(authenticated)/relational-ui/components/UI/ContextMenu";
import GridTableHeader from "./Header/GridTableHeader";
import GridTableRows from "./GridTableRows";
import useKeyboardNavigation from "./useKeyboardNavigation";
import useContextMenu from "./useContextMenu";
import RenameModal from "@/app/(authenticated)/relational-ui/components/UI/RenameColumnModal";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { useUserSettings } from "@/components/UserSettingsContext";
import { getFontVars } from "@/components/FontSizeVarsProvider";

interface GridTableProps {
  tableName: string;
  columns: CustomColumnDef<Row>[];
  data: Row[];
  onOpenSettingsPanel: (col: CustomColumnDef<Row>) => void;
  isSettingsPanelOpen: boolean;
  onUpdateTable: (
    name: string,
    updated: { columns: CustomColumnDef<Row>[]; data: Row[] }
  ) => void;
}

const GridTable: React.FC<GridTableProps> = ({
  tableName,
  columns,
  data,
  onOpenSettingsPanel,
  isSettingsPanelOpen,
  onUpdateTable,
}) => {
  // Local columns state to enable immediate updates and control
  const [rawColumns, setRawColumns] = useState<CustomColumnDef<Row>[]>(
    () => columns.filter((col) => col.accessorKey !== "__rowId")
  );

  useEffect(() => {
    setRawColumns(columns.filter((col) => col.accessorKey !== "__rowId"));
  }, [columns]);

  // Local data state for rows
  const [dataState, setDataState] = useState<Row[]>(data);

  useEffect(() => {
    setDataState(
      data.map((row) => ({
        ...row,
        id: String(row.id),
        __rowId: String(row.id),
      }))
    );
  }, [data]);

  // Focus/edit states
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [focusedColIndex, setFocusedColIndex] = useState<number | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<CustomColumnDef<Row> | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ index: number; name: string } | null>(null);
  const [renamePosition, setRenamePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [columnHighlightMode, setColumnHighlightMode] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(rawColumns.map((col) => col.accessorKey));

  const containerRef = useRef<HTMLDivElement>(null);

  // Context menu hook (includes mobile long-press!)
  const {
    scrollContainerRef,
    showContextMenu,
    contextMenuPosition,
    contextTarget,
    handleContextMenu,
    handleContextAction,
    setShowContextMenu,
    setContextTarget,
    getTouchHandlers, // <-- receive this from the hook
  } = useContextMenu({
    data: dataState,
    setData: (newData) => {
      setDataState(newData);
      onUpdateTable(tableName, { columns: rawColumns, data: newData });
    },
    rawColumns,
    setRawColumns: (newCols) => {
      setRawColumns(newCols);
      onUpdateTable(tableName, { columns: newCols, data: dataState });
    },
    setRenameTarget,
    setRenamePosition,
    setShowRenameModal,
    containerRef,
  });

  // Cell save handler
  const handleSave = useCallback(
    (id: string, key: string, value: any) => {
      setDataState((prev) => {
        const updated = prev.map((row) =>
          ((row.__rowId ?? row.id) === id && key !== "id") ? { ...row, [key]: value } : row
        );
        onUpdateTable(tableName, { columns: rawColumns, data: updated });
        return updated;
      });
    },
    [onUpdateTable, tableName, rawColumns]
  );

  // Edit complete: optionally advance focus
  const handleEditComplete = useCallback(() => {
    if (editingCell && focusedCell) {
      const totalRows = dataState.length;
      const { rowIndex, colIndex } = focusedCell;
      if (rowIndex < totalRows - 1) {
        setFocusedCell({ rowIndex: rowIndex + 1, colIndex });
      }
    }
    setEditingCell(null);
  }, [editingCell, focusedCell, dataState.length]);

  // Cell click handler
  const handleCellClick = useCallback(
    (rowIndex: number, colIndex: number, isEditable: boolean) => {
      setColumnHighlightMode(false);
      setFocusedRowIndex(null);

      if (editingCell?.rowIndex === rowIndex && editingCell.colIndex === colIndex) return;

      setFocusedCell({ rowIndex, colIndex });
      setFocusedColIndex(colIndex);

      const matchedRawCol = rawColumns[colIndex];
      if (matchedRawCol) {
        setFocusedColumn(matchedRawCol);
      }

      if (isEditable) setEditingCell({ rowIndex, colIndex });
    },
    [editingCell, rawColumns]
  );

  // Build columns for react-table
  const { settings } = useUserSettings();
  const userCurrencyCode = settings.currencyCode;

  const columnDefs = useMemo(() => {
    return buildColumnDefs(
      editingCell,
      handleSave,
      handleEditComplete,
      setEditingCell,
      rawColumns,
      userCurrencyCode
    );
  }, [editingCell, handleSave, handleEditComplete, rawColumns, userCurrencyCode]);

  // React-table instance
  const table = useReactTable({
    data: dataState,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: "onChange",
    getRowId: (row) => row.__rowId,
  });

  // Keyboard navigation
  useKeyboardNavigation({
    showRenameModal,
    focusedCell,
    columnDefs: rawColumns,
    data: dataState,
    editingCell,
    setFocusedCell,
    setEditingCell,
    rawColumns,
  });

  // Rename modal submit
  const handleRename = useCallback(
    (newName: string) => {
      if (renameTarget && newName.trim()) {
        const updatedCols = rawColumns.map((col, i) =>
          i === renameTarget.index - 1 ? { ...col, header: newName.trim() } : col
        );
        setRawColumns(updatedCols);
        onUpdateTable(tableName, { columns: updatedCols, data: dataState });
      }
      setShowRenameModal(false);
    },
    [renameTarget, rawColumns, dataState, tableName, onUpdateTable]
  );

  // Open settings panel with focused col
  useEffect(() => {
    if (isSettingsPanelOpen && focusedColumn && !showRenameModal) {
      onOpenSettingsPanel(focusedColumn);
    }
  }, [focusedColumn?.accessorKey, isSettingsPanelOpen, showRenameModal]);

  // Table size/style from context
  const { fontSize, rowHeight } = useTableSettings();
  const fontVars = getFontVars(fontSize, rowHeight);

  // Compute column widths for layout
  const getRowNumberColumnWidth = (rowCount: number, fontSize: number) => {
    const digits = String(rowCount).length;
    return Math.ceil(digits * fontSize * 0.7 + fontSize * 2.2);
  };
  const rowCount = table.getRowModel().rows.length;
  const rowNumberWidth = getRowNumberColumnWidth(rowCount, fontSize);
  const MIN_COL_WIDTH = 48;
  const columnWidths = useMemo(
    () => [
      rowNumberWidth,
      ...table.getVisibleLeafColumns().map((col) =>
        Math.max(col.getSize() || 120, MIN_COL_WIDTH)
      ),
    ],
    [rowNumberWidth, table, fontSize]
  );

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="relative h-[calc(100vh-3rem)] w-full overflow-auto bg-white dark:bg-gray-950 text-black dark:text-white rounded-xl shadow border border-gray-200 dark:border-gray-800 px-4 pt-4 pb-4"
        style={{
          ...fontVars,
          fontSize: `${fontSize}px`,
          lineHeight: `${rowHeight}px`,
        }}
      >
        <div className="min-w-max">
          <GridTableHeader
            table={table}
            rawColumns={rawColumns}
            containerRef={scrollContainerRef}
            setRenamePosition={setRenamePosition}
            setColumnBeingRenamed={setRenameTarget}
            setShowRenameModal={setShowRenameModal}
            handleContextMenu={handleContextMenu}
            getTouchHandlers={getTouchHandlers}    // <-- pass here!
            setRawColumns={(cols) => {
              setRawColumns(cols);
              onUpdateTable(tableName, { columns: cols, data: dataState });
            }}
            setData={(rows) => {
              setDataState(rows);
              onUpdateTable(tableName, { columns: rawColumns, data: rows });
            }}
            focusedColIndex={focusedColIndex}
            setFocusedRowIndex={setFocusedRowIndex}
            onFocusColumn={useCallback(
              (col, index) => {
                if (showRenameModal) return;
                setFocusedColIndex(index);
                setFocusedColumn(col);
                setColumnHighlightMode(true);
              },
              [showRenameModal]
            )}
            onOpenSettingsPanel={onOpenSettingsPanel}
            columnWidths={columnWidths}
          />

          <GridTableRows
            table={table}
            listHeight={scrollContainerRef.current?.clientHeight || 0}
            focusedCell={focusedCell}
            editingCell={editingCell}
            handleCellClick={handleCellClick}
            handleContextMenu={handleContextMenu}
            getTouchHandlers={getTouchHandlers}    // <-- pass here!
            focusedColIndex={focusedColIndex}
            focusedRowIndex={focusedRowIndex}
            setFocusedRowIndex={setFocusedRowIndex}
            setFocusedColIndex={setFocusedColIndex}
            columnHighlightMode={columnHighlightMode}
            columnWidths={columnWidths}
          />
        </div>

        {showRenameModal && renameTarget && (
          <RenameModal
            position={renamePosition}
            initialName={renameTarget.name}
            onClose={() => setShowRenameModal(false)}
            onRename={handleRename}
          />
        )}

        {showContextMenu && contextTarget && (
          <ContextMenu
            position={contextMenuPosition}
            rowIndex={contextTarget.rowIndex}
            colIndex={contextTarget.colIndex}
            onInsertAbove={() => handleContextAction("insertAbove")}
            onInsertBelow={() => handleContextAction("insertBelow")}
            onDuplicateRow={() => handleContextAction("duplicateRow")}
            onDeleteRow={() => handleContextAction("deleteRow")}
            onInsertColLeft={() => handleContextAction("insertColLeft")}
            onInsertColRight={() => handleContextAction("insertColRight")}
            onDeleteCol={() => handleContextAction("deleteCol")}
            onRenameColumn={() => handleContextAction("renameColumn")}
            onHideColumn={() => {}}
            onSortAsc={() => {}}
            onSortDesc={() => {}}
            onFilterColumn={() => {}}
            onClose={() => setShowContextMenu(false)}
          />
        )}
      </div>
    </div>
  );
};

export default GridTable;
