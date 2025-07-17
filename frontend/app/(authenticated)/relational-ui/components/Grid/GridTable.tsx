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
import { getFontVars } from "@/components/settings/font/FontSizeVarsProvider";

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
  onRenameColumn: (accessorKey: string, newHeader: string) => void;
  onReorderColumns: (newColumns: CustomColumnDef<Row>[]) => void;
  onAddColumn: (newCol: CustomColumnDef<Row>) => void;
  onDeleteColumn: (accessorKey: string) => void;
  onCellUpdate?: (rowIndex: number, columnId: string, newValue: unknown) => void;
  onDeleteRow?: (rowIndex: number) => void;
  permissions?: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

const GridTable: React.FC<GridTableProps> = ({
  tableName,
  columns,
  data,
  onOpenSettingsPanel,
  isSettingsPanelOpen,
  onUpdateTable,
  onRenameColumn,
  onReorderColumns,
  onAddColumn,
  onDeleteColumn,
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
        id: Number(row.id),
        __rowId: Number(row.id),
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
    //setContextTarget,
    getTouchHandlers,
  } = useContextMenu({
    data: dataState,
    setData: (newDataOrUpdater) => {
      const nextRows =
        typeof newDataOrUpdater === "function"
          ? newDataOrUpdater(dataState)
          : newDataOrUpdater;
      setDataState(newDataOrUpdater); // always let React handle
      onUpdateTable(tableName, { columns: rawColumns, data: nextRows });
    },
    rawColumns,
    setRawColumns: (newColsOrUpdater) => {
      setRawColumns(newColsOrUpdater);
      const nextCols =
        typeof newColsOrUpdater === "function"
          ? newColsOrUpdater(rawColumns)
          : newColsOrUpdater;
      onUpdateTable(tableName, { columns: nextCols, data: dataState });
    },
    setRenameTarget,
    setRenamePosition,
    setShowRenameModal,
    containerRef,
  });

  // Cell save handler
  const handleSave = useCallback(
    (id: number, key: string, value: unknown) => {
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
      console.log('[handleCellClick]', {
        rowIndex,
        colIndex,
        isEditable,
        editingCell,
        colType: rawColumns[colIndex]?.type,
        rawColumns,
      });

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
    getRowId: (row) => String(row.__rowId),
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
  }, [focusedColumn, isSettingsPanelOpen, showRenameModal, onOpenSettingsPanel]);

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
    [rowNumberWidth, table]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full">
      <div
        className="flex-1 min-h-0 bg-white dark:bg-gray-950 text-black dark:text-white rounded-xl shadow border border-gray-200 dark:border-gray-800 px-4 pt-4 pb-4 flex flex-col"
        style={{
          ...fontVars,
          fontSize: `${fontSize}px`,
          lineHeight: `${rowHeight}px`,
        }}
      >
        {/* HORIZONTAL scroll only here */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden" // <-- ONLY overflow-x-auto!
          style={{ position: "relative" }}
        >
          {/* The TABLE AREA (min-w-max to allow wide columns) */}
          <div className="min-w-max flex flex-col flex-1 min-h-0">
            {/* HEADER: Not scrollable vertically, sticky if desired */}
            <div className="flex-none">
              <GridTableHeader
                table={table}
                rawColumns={rawColumns}
                containerRef={scrollContainerRef}
                setRenamePosition={setRenamePosition}
                setColumnBeingRenamed={setRenameTarget}
                setShowRenameModal={setShowRenameModal}
                handleContextMenu={handleContextMenu}
                getTouchHandlers={getTouchHandlers}
                setRawColumns={(colsOrUpdater) => {
                  const nextCols =
                    typeof colsOrUpdater === "function"
                      ? colsOrUpdater(rawColumns)
                      : colsOrUpdater;
                  setRawColumns(colsOrUpdater);
                  onUpdateTable(tableName, { columns: nextCols, data: dataState });
                }}
                setData={(rowsOrUpdater) => {
                  const nextRows =
                    typeof rowsOrUpdater === "function"
                      ? rowsOrUpdater(dataState)
                      : rowsOrUpdater;
                  setDataState(rowsOrUpdater);
                  onUpdateTable(tableName, { columns: rawColumns, data: nextRows });
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
                rowNumberWidth={rowNumberWidth}
                onRenameColumn={onRenameColumn}
                onReorderColumns={onReorderColumns}
                onAddColumn={onAddColumn}
                onDeleteColumn={onDeleteColumn}
              />
            </div>
            {/* ROWS: ONLY THIS gets overflow-y-auto! */}
            <div
              className="flex-1 min-h-0 overflow-y-auto"
              style={{ paddingBottom: `${rowHeight}px` }}
            >
              <GridTableRows
                table={table}
                listHeight={scrollContainerRef.current?.clientHeight || 0}
                focusedCell={focusedCell}
                handleCellClick={handleCellClick}
                handleContextMenu={handleContextMenu}
                getTouchHandlers={getTouchHandlers}
                focusedColIndex={focusedColIndex}
                focusedRowIndex={focusedRowIndex}
                setFocusedRowIndex={setFocusedRowIndex}
                setFocusedColIndex={setFocusedColIndex}
                columnHighlightMode={columnHighlightMode}
                columnWidths={columnWidths}
                rowNumberWidth={rowNumberWidth}
              />
            </div>
          </div>
        </div>

        {/* Modals and context menu as before */}
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
