import React from "react";
import { flexRender, Header } from "@tanstack/react-table";
import { Row, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import ColumnResizeHandle from "./ColumnResizeHandle";

const MIN_COL_WIDTH = 48;

interface Props {
  header: Header<Row, unknown>;
  col: CustomColumnDef<Row>;
  colWidth: number;
  focused: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  fontSize: number;
  rowHeight: number;
  dragHandleProps?: any; // <- NEW
}

export default function HeaderCellContent({
  header,
  col,
  colWidth,
  focused,
  onClick,
  onDoubleClick,
  onContextMenu,
  fontSize,
  rowHeight,
  dragHandleProps,
}: Props) {
  return (
    <div
      className={`sticky top-0 z-50 border-r border-gray-300 dark:border-gray-700 transition-all duration-150 overflow-hidden truncate flex items-center justify-center
        ${focused
          ? "bg-gray-300 dark:bg-gray-600 shadow"
          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow"
        }`}
      style={{
        width: colWidth,
        minWidth: MIN_COL_WIDTH,
        height: rowHeight,
        minHeight: rowHeight,
        fontSize,
        fontWeight: 600,
        cursor: "pointer",
        position: "relative",
        boxSizing: "border-box",
        transition: "width 0.05s",
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* DRAGGABLE AREA */}
      <span
        className="truncate block text-center w-full select-none"
        style={{ 
            fontSize,
            lineHeight: `${rowHeight}px`,
            transition: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "none",
        }}
        {...dragHandleProps}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
      {/* RESIZE HANDLE */}
      {header.column.getCanResize() && <ColumnResizeHandle header={header} />}
    </div>
  );
}
