import React from "react";
import { Table } from "@tanstack/react-table";
import { CustomColumnDef, Row, ColumnDataType } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";

// DnD-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";

// Components
import DraggableHeaderCell from "./DraggableHeaderCell";
import HeaderCellContent from "./HeaderCellContent";
import AddColumnButton from "./AddColumnButton";

// Import your global fontVars helper
import { getFontVars } from "@/components/FontSizeVarsProvider";

// --- Types
interface Props {
  table: Table<Row>;
  rawColumns: CustomColumnDef<Row>[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  setRenamePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setColumnBeingRenamed: React.Dispatch<React.SetStateAction<{ index: number; name: string } | null>>;
  setShowRenameModal: React.Dispatch<React.SetStateAction<boolean>>;
  focusedColIndex: number | null;
  onFocusColumn: (col: CustomColumnDef<Row>, index: number) => void;
  columnWidths: number[];
  onOpenSettingsPanel: (col: CustomColumnDef<Row>) => void;
  setRawColumns: React.Dispatch<React.SetStateAction<CustomColumnDef<Row>[]>>;
  setData: React.Dispatch<React.SetStateAction<Row[]>>;
  handleContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
  getTouchHandlers: <T extends Element = HTMLDivElement>(
    rowIndex: number,
    colIndex: number
  ) => React.HTMLAttributes<T>;
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number | null>>;
  rowNumberWidth: number;
  onRenameColumn: (accessorKey: string, newHeader: string) => void;
  onReorderColumns: (newColumns: CustomColumnDef<Row>[]) => void;
  onAddColumn: (newCol: CustomColumnDef<Row>) => void;
  onDeleteColumn: (accessorKey: string) => void;
}

const MIN_COL_WIDTH = 48;
//const getRowNumberColumnWidth = (rowCount: number, fontSize: number) => {
  //const digits = String(rowCount).length;
  //return Math.ceil(digits * fontSize * 0.7 + fontSize * 2.2); # Lint error removed for now
//};

const GridTableHeader: React.FC<Props> = ({
  table,
  rawColumns,
  containerRef,
  setRenamePosition,
  setColumnBeingRenamed,
  setShowRenameModal,
  focusedColIndex,
  onFocusColumn,
  setRawColumns,
  setData,
  handleContextMenu,
  getTouchHandlers,
  setFocusedRowIndex,
  rowNumberWidth,
  onRenameColumn,
  onReorderColumns,
  onAddColumn,
  onDeleteColumn,
}) => {
  const { fontSize, rowHeight } = useTableSettings();
  const fontVars = getFontVars(fontSize, rowHeight);

  const headerGroups = table?.getHeaderGroups?.();
  //const rowCount = table.getRowModel().rows.length;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Add Column Logic
  const handleAddColumn = (type: ColumnDataType) => {
    const newKey = `col_${Date.now()}`;
    const newCol: CustomColumnDef<Row> = {
      accessorKey: newKey,
      header: `New ${type}`,
      type,
    };

    setRawColumns((prev) => [...prev, newCol]);
    setData((prev) =>
      prev.map((row) => ({
        ...row,
        [newKey]:
          type === "number" ? 0 :
          type === "boolean" ? false :
          type === "date" ? null :
          type === "formula" ? "" :
          "",
      }))
    );
  };

  if (!headerGroups) return null;

  return (
    <div className="w-full relative z-0">
      {headerGroups.map((headerGroup) => {
        const headerIds = headerGroup.headers.map((header) => header.column.id);

        return (
          <DndContext
            key={headerGroup.id}
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (active && over && String(active.id) !== String(over.id)) {
                setRawColumns((oldCols) => {
                  const oldIdx = oldCols.findIndex(col => String(col.accessorKey) === String(active.id));
                  const newIdx = oldCols.findIndex(col => String(col.accessorKey) === String(over.id));
                  if (oldIdx === -1 || newIdx === -1) return oldCols;
                  return arrayMove(oldCols, oldIdx, newIdx);
                });
              }
            }}
          >
            <SortableContext items={headerIds} strategy={horizontalListSortingStrategy}>
              <div
                className="grid w-full"
                style={{
                  ...fontVars,
                  gridTemplateColumns: `${rowNumberWidth}px ${headerGroup.headers
                    .map((h) => `${Math.max(h.getSize() || 120, MIN_COL_WIDTH)}px`)
                    .join(" ")} 40px`,
                  // Don't set zIndex here, sticky cells will handle it
                }}
              >
                {/* Sticky Row Number Header Cell */}
                <div
                  style={{
                    width: `${rowNumberWidth}px`,
                    fontSize: "var(--body)",
                    height: "var(--row)",
                    minHeight: "var(--row)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                  className="sticky top-0 left-0 z-30 bg-gray-100 dark:bg-gray-800 border-r border-b border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 select-none shadow-right"
                  onClick={() => setFocusedRowIndex(null)}
                  onContextMenu={(e) => handleContextMenu(e, -1, 0)}
                  {...(typeof getTouchHandlers === "function" ? getTouchHandlers(-1, 0) : {})}
                >
                  #
                </div>

                {/* Sticky Column Headers */}
                {headerGroup.headers.map((header, index) => {
                  const adjustedIndex = index;
                  const col = rawColumns[adjustedIndex];
                  const colWidth = Math.max(header.getSize(), MIN_COL_WIDTH);

                  return (
                    <DraggableHeaderCell key={header.id} header={header}>
                      {dragHandleProps => (
                        <div
                          className={
                            "sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" +
                            (adjustedIndex === 0 ? " " : "")
                          }
                          style={{
                            width: `${colWidth}px`,
                            minWidth: `${colWidth}px`,
                            maxWidth: `${colWidth}px`,
                            height: "var(--row)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <HeaderCellContent
                            header={header}
                            col={col}
                            colWidth={colWidth}
                            fontSize={fontSize}
                            rowHeight={rowHeight}
                            dragHandleProps={dragHandleProps}
                            focused={focusedColIndex === adjustedIndex}
                            onClick={(e) => {
                              if (!col) return;
                              if (e.detail === 1) {
                                setFocusedRowIndex(null);
                                onFocusColumn(col, adjustedIndex);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!col || !containerRef.current) return;

                              const headerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const containerRect = containerRef.current.getBoundingClientRect();
                              const relativeX = headerRect.left - containerRect.left;
                              const relativeY = headerRect.bottom - containerRect.top + 4;

                              setRenamePosition({ x: relativeX, y: relativeY });
                              setColumnBeingRenamed({ index: adjustedIndex + 1, name: String(col.header || "") });
                              setShowRenameModal(true);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleContextMenu(e, -1, adjustedIndex + 1);
                            }}
                            {...(typeof getTouchHandlers === "function" ? getTouchHandlers(-1, adjustedIndex + 1) : {})}
                          />
                        </div>
                      )}
                    </DraggableHeaderCell>
                  );
                })}

                {/* Add Column Button */}
                <div
                  className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                  style={{
                    width: "40px",
                    minWidth: "40px",
                    maxWidth: "40px",
                    height: "var(--row)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AddColumnButton
                    onAddColumn={handleAddColumn}
                    fontSize={fontSize}
                    rowHeight={rowHeight}
                  />
                </div>
              </div>
            </SortableContext>
          </DndContext>
        );
      })}
    </div>
  );
};

export default GridTableHeader;
