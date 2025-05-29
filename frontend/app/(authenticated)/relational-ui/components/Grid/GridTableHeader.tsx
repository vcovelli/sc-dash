import React, { useState, useRef, useEffect } from "react";
import { flexRender, Table } from "@tanstack/react-table";
import { CustomColumnDef, Row, ColumnDataType } from "@/app/(authenticated)/relational-ui/lib/types";
import { PlusIcon } from "lucide-react";

interface Props {
  table: Table<Row>;
  rawColumns: CustomColumnDef<Row>[];
  containerRef: React.RefObject<HTMLDivElement | null>
  setRenamePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setColumnBeingRenamed: React.Dispatch<React.SetStateAction<{ index: number; name: string } | null>>;
  setShowRenameModal: React.Dispatch<React.SetStateAction<boolean>>;
  focusedColIndex: number | null;
  onFocusColumn: (col: CustomColumnDef<Row>, index: number) => void;
  onOpenSettingsPanel: (col: CustomColumnDef<Row>) => void;
  setRawColumns: React.Dispatch<React.SetStateAction<CustomColumnDef<Row>[]>>;
  setData: React.Dispatch<React.SetStateAction<Row[]>>;
  handleContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
  setFocusedRowIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const getRowNumberColumnWidth = (rowCount: number) => {
  const digits = String(rowCount).length;
  return digits * 8 + 32;
};

const columnTypes: { label: string; type: ColumnDataType }[] = [
  { label: "Text", type: "text" },
  { label: "Number", type: "number" },
  { label: "Boolean (Checkbox)", type: "boolean" },
  { label: "Date", type: "date" },
  { label: "Choice List", type: "choice" },
  { label: "Reference List", type: "reference" },
  { label: "Attachment", type: "attachment" },
  { label: "Formula", type: "formula" },
  { label: "Link", type: "link" },
];

const GridTableHeader: React.FC<Props> = ({
  table,
  rawColumns,
  containerRef,
  setRenamePosition,
  setColumnBeingRenamed,
  setShowRenameModal,
  focusedColIndex,
  onFocusColumn,
  onOpenSettingsPanel,
  setRawColumns,
  setData,
  handleContextMenu,
  setFocusedRowIndex,
}) => {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showTypeSubmenu, setShowTypeSubmenu] = useState(false);
  const addBtnRef = useRef<HTMLDivElement>(null);
  const [addMenuPos, setAddMenuPos] = useState<{ x: number; y: number } | null>(null);

  const headerGroups = table?.getHeaderGroups?.();
  const rowCount = table.getRowModel().rows.length;
  const rowNumberWidth = getRowNumberColumnWidth(rowCount);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("add-column-dropdown");
      const button = addBtnRef.current;
      if (
        dropdown &&
        !dropdown.contains(e.target as Node) &&
        button &&
        !button.contains(e.target as Node)
      ) {
        setShowAddDropdown(false);
        setShowTypeSubmenu(false);
      }
    };

    if (showAddDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddDropdown]);

  if (!headerGroups) return null;

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

    setShowAddDropdown(false);
    setShowTypeSubmenu(false);
    onOpenSettingsPanel(newCol);
  };

  return (
    <div className="overflow-auto w-full relative">
      {headerGroups.map((headerGroup) => (
        <div
          key={headerGroup.id}
          className="grid bg-gray-100 dark:bg-gray-800 font-semibold text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 w-full"
          style={{
            gridTemplateColumns: `${rowNumberWidth}px ${headerGroup.headers
              .map((h) => `${h.getSize() || 120}px`)
              .join(" ")} 40px`,
          }}
        >
          <div
            style={{ width: `${rowNumberWidth}px`, zIndex: 60 }}
            className="sticky top-0 left-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 text-xs font-mono text-gray-400 dark:text-gray-500 px-2 py-2 text-center select-none cursor-pointer shadow-right"
            onClick={() => setFocusedRowIndex(null)}
            onContextMenu={(e) => handleContextMenu(e, -1, 0)}
          >
            #
          </div>

          {headerGroup.headers.map((header, index) => {
            const adjustedIndex = index;
            const col = rawColumns[adjustedIndex];

            return (
              <div
                key={header.id}
                className={`sticky top-0 z-50 border-r border-gray-300 dark:border-gray-700 whitespace-nowrap px-3 py-2 cursor-pointer transition-all duration-150 overflow-hidden text-ellipsis truncate ${
                  focusedColIndex === adjustedIndex
                    ? "bg-gray-300 dark:bg-gray-600 shadow"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow"
                }`}
                style={{
                  width: header.getSize(),
                  transition: "width 0.05s ease-out",
                  minWidth: "80px",
                }}
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
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="absolute top-0 right-0 h-full w-1 bg-transparent cursor-col-resize z-10 select-none"
                  />
                )}
              </div>
            );
          })}

          <div
            ref={addBtnRef}
            className="border-r border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              const rect = addBtnRef.current?.getBoundingClientRect();
              if (rect) {
                setAddMenuPos({ x: rect.left, y: rect.bottom });
              }
              setShowAddDropdown((prev) => !prev);
            }}
          >
            <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      ))}

      {showAddDropdown && addMenuPos && (
        <div
          id="add-column-dropdown"
          className="absolute z-50 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow rounded text-sm text-gray-800 dark:text-gray-200"
          style={{ position: "fixed", top: addMenuPos.y, left: addMenuPos.x }}
        >
          <div className="p-2">
            <div className="font-semibold mb-1 text-gray-700 dark:text-gray-100">Add column with type</div>
            {columnTypes.map((col) => (
              <div
                key={col.type}
                className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleAddColumn(col.type)}
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GridTableHeader;
