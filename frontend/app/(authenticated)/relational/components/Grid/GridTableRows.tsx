"use client";

import React, { useCallback } from "react";
import { flexRender, Table } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { Row } from "@relational/lib/types";
import { FixedSizeList as List } from "react-window";

interface Props {
  table: Table<Row>;
  focusedCell: { rowIndex: number; colIndex: number } | null;
  editingCell: { rowIndex: number; colIndex: number } | null;
  handleCellClick: (rowIndex: number, colIndex: number, isEditable: boolean) => void;
  handleContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
  zebraStriping: boolean;
  focusedColIndex: number | null;
  focusedRowIndex?: number | null;
  setFocusedRowIndex?: (index: number | null) => void;
  setFocusedColIndex?: (index: number | null) => void;
  columnHighlightMode?: boolean;
  listHeight: number;
}

const getRowNumberColumnWidth = (rowCount: number) => {
  const digits = String(rowCount).length;
  return digits * 8 + 32;
};

// ⬇️ Removed custom memoization logic!
const MemoizedRowRenderer = (props: any) => {
  const {
    row,
    index,
    style,
    focusedCell,
    editingCell,
    handleCellClick,
    handleContextMenu,
    zebraStriping,
    focusedColIndex,
    focusedRowIndex,
    setFocusedRowIndex,
    setFocusedColIndex,
    columnHighlightMode,
    rowNumberWidth,
  } = props;

  const isRowFocused = focusedRowIndex === index;
  const isZebra = zebraStriping && index % 2 === 1;

  return (
    <div
      key={row.id}
      style={{
        ...style,
        display: "grid",
        gridTemplateColumns: `${rowNumberWidth}px ${row
          .getVisibleCells()
          .map((cell: any) => `${cell.column.getSize()}px`)
          .join(" ")}`,
      }}
      className={`border-b transition-colors duration-150 ${
        isRowFocused ? "bg-green-100" : isZebra ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div
        className={`sticky left-0 z-40 bg-white border-r text-center text-xs font-mono text-gray-500 px-2 py-1 select-none cursor-pointer shadow-right before:content-[''] before:absolute before:top-0 before:left-[-16px] before:bottom-0 before:w-6 before:bg-white ${
          isRowFocused ? "bg-green-200 font-bold text-black" : ""
        }`}
        onClick={() => {
          setFocusedRowIndex?.(index);
          setFocusedColIndex?.(null);
        }}
        onContextMenu={(e) => handleContextMenu(e, index, 0)}
      >
        {index + 1}
      </div>

      {row.getVisibleCells().map((cell: any, colIndex: number) => {
        const isFocused =
          focusedCell?.rowIndex === index && focusedCell?.colIndex === colIndex;
        const isEditable = cell.column.id !== "__rownum__";
        const isColFocused = columnHighlightMode && focusedColIndex === colIndex;

        return (
          <div
            key={cell.id}
            className={`relative border-r text-sm px-2 py-1 overflow-visible transition-colors duration-100 ${
              isFocused
                ? "bg-yellow-100 ring-2 ring-yellow-400 z-10"
                : isColFocused
                ? "bg-blue-100"
                : ""
            }`}
            onClick={() => handleCellClick(index, colIndex, isEditable)}
            onContextMenu={(e) => handleContextMenu(e, index, colIndex)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        );
      })}
    </div>
  );
};

const GridTableRows: React.FC<Props> = ({
  table,
  focusedCell,
  editingCell,
  handleCellClick,
  handleContextMenu,
  zebraStriping,
  focusedColIndex,
  focusedRowIndex,
  setFocusedRowIndex,
  setFocusedColIndex,
  columnHighlightMode = false,
  listHeight,
}) => {
  const rows = table.getRowModel().rows;
  const rowHeight = 40;
  const rowNumberWidth = getRowNumberColumnWidth(rows.length);

  const RowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <MemoizedRowRenderer
        key={rows[index]?.id || index}
        row={rows[index]}
        index={index}
        style={style}
        focusedCell={focusedCell}
        editingCell={editingCell}
        handleCellClick={handleCellClick}
        handleContextMenu={handleContextMenu}
        zebraStriping={zebraStriping}
        focusedColIndex={focusedColIndex}
        focusedRowIndex={focusedRowIndex}
        setFocusedRowIndex={setFocusedRowIndex}
        setFocusedColIndex={setFocusedColIndex}
        columnHighlightMode={columnHighlightMode}
        rowNumberWidth={rowNumberWidth}
      />
    ),
    [
      rows,
      focusedCell,
      editingCell,
      handleCellClick,
      handleContextMenu,
      zebraStriping,
      focusedColIndex,
      focusedRowIndex,
      setFocusedRowIndex,
      setFocusedColIndex,
      columnHighlightMode,
      rowNumberWidth,
    ]
  );

  const shouldVirtualize = rows.length > 10;
  const virtualListHeight = Math.min(listHeight, rows.length * rowHeight);

  return (
    <AnimatePresence initial={false}>
      {shouldVirtualize ? (
        <List
          height={virtualListHeight}
          itemCount={rows.length}
          itemSize={rowHeight}
          width="100%"
        >
          {RowRenderer}
        </List>
      ) : (
        <div>
          {rows.map((_, i) => (
            <React.Fragment key={rows[i]?.id || i}>
              {RowRenderer({ index: i, style: {} })}
            </React.Fragment>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default GridTableRows;
