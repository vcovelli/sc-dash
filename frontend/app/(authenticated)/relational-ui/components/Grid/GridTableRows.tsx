"use client";

import React, { useCallback } from "react";
import { flexRender, Table, Row as TableRow } from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import { Row } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { FixedSizeList as List } from "react-window";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { getFontVars } from "@/components/FontSizeVarsProvider";

interface Props {
  table: Table<Row>;
  focusedCell: { rowIndex: number; colIndex: number } | null;
  handleCellClick: (rowIndex: number, colIndex: number, isEditable: boolean) => void;
  handleContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
  getTouchHandlers?: (rowIndex: number, colIndex: number) => React.HTMLAttributes<HTMLElement>;
  focusedColIndex: number | null;
  focusedRowIndex?: number | null;
  setFocusedRowIndex?: (index: number | null) => void;
  setFocusedColIndex?: (index: number | null) => void;
  columnHighlightMode?: boolean;
  listHeight: number;
  columnWidths: number[];
}

interface MemoizedRowRendererProps {
  row: TableRow<Row>;
  index: number;
  style: React.CSSProperties;
  focusedCell: { rowIndex: number; colIndex: number } | null;
  handleCellClick: (rowIndex: number, colIndex: number, isEditable: boolean) => void;
  handleContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number) => void;
  getTouchHandlers?: (rowIndex: number, colIndex: number) => React.HTMLAttributes<HTMLElement>;
  zebraStriping: boolean;
  focusedColIndex: number | null;
  focusedRowIndex?: number | null;
  setFocusedRowIndex?: (index: number | null) => void;
  setFocusedColIndex?: (index: number | null) => void;
  columnHighlightMode?: boolean;
  rowNumberWidth: number;
  rowHeight: number;
}

const getRowNumberColumnWidth = (rowCount: number, fontSize: number) => {
  const digits = String(rowCount).length;
  return digits * fontSize + fontSize * 2;
};

const MemoizedRowRenderer = ({
  row,
  index,
  style,
  focusedCell,
  handleCellClick,
  handleContextMenu,
  getTouchHandlers,
  zebraStriping,
  focusedColIndex,
  focusedRowIndex,
  setFocusedRowIndex,
  setFocusedColIndex,
  columnHighlightMode,
  rowNumberWidth,
  rowHeight,
}: MemoizedRowRendererProps) => {
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
          .map((cell) => `${cell.column.getSize()}px`)
          .join(" ")}`,
        fontSize: "var(--body)",
        minHeight: rowHeight,
        height: rowHeight,
        lineHeight: 1.1,
      }}
      className={`border-b transition-colors duration-150 select-none ${
        isRowFocused
          ? "bg-green-100 dark:bg-green-800 dark:text-white"
          : isZebra
          ? "bg-gray-50 dark:bg-gray-800"
          : "bg-white dark:bg-black"
      }`}
    >
      <div
        className={`sticky left-0 z-40 border-r text-center font-mono px-1 py-0 cursor-pointer shadow-right bg-white dark:bg-black dark:text-gray-300 ${
          isRowFocused
            ? "bg-green-200 font-bold text-black dark:bg-green-700 dark:text-white"
            : "text-gray-500"
        }`}
        style={{
          fontSize: "var(--body)",
          height: rowHeight,
          minHeight: rowHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          setFocusedRowIndex?.(index);
          setFocusedColIndex?.(null);
        }}
        onContextMenu={(e) => handleContextMenu(e, index, 0)}
        {...(typeof getTouchHandlers === "function" ? getTouchHandlers(index, 0) : {})}
      >
        {index + 1}
      </div>

      {row.getVisibleCells().map((cell, colIndex: number) => {
        const isFocused =
          focusedCell?.rowIndex === index && focusedCell?.colIndex === colIndex;
        const isEditable = cell.column.id !== "__rownum__";
        const isColFocused = columnHighlightMode && focusedColIndex === colIndex;

        return (
          <div
            key={cell.id}
            data-row-id={row.original?.__rowId || row.original?.id}
            data-col-id={cell.column.id}
            className={`relative border-r px-1 py-0 min-w-0 overflow-hidden transition-colors duration-100 ${
              isFocused
                ? "bg-yellow-100 ring-2 ring-yellow-400 z-10 dark:bg-yellow-900"
                : isColFocused
                ? "bg-blue-100 dark:bg-blue-900"
                : ""
            }`}
            style={{
              fontSize: "var(--body)",
              height: rowHeight,
              minHeight: rowHeight,
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => handleCellClick(index, colIndex, isEditable)}
            onContextMenu={(e) => handleContextMenu(e, index, colIndex)}
            {...(typeof getTouchHandlers === "function" ? getTouchHandlers(index, colIndex) : {})}
          >
            {flexRender(cell.column.columnDef.cell, {
              ...cell.getContext(),
              fontSize: "var(--body)",
              rowHeight,
            })}
          </div>
        );
      })}
    </div>
  );
};

const GridTableRows: React.FC<Props> = ({
  table,
  focusedCell,
  handleCellClick,
  handleContextMenu,
  getTouchHandlers,
  focusedColIndex,
  focusedRowIndex,
  setFocusedRowIndex,
  setFocusedColIndex,
  columnHighlightMode = false,
  listHeight,
}) => {
  const { fontSize, rowHeight, zebraStriping } = useTableSettings();
  const fontVars = getFontVars(fontSize || "base");
  const rows = table.getRowModel().rows;
  const computedRowHeight = rowHeight ?? Math.round(fontSize * 1.7);
  const rowNumberWidth = getRowNumberColumnWidth(rows.length, fontSize);

  const RowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <MemoizedRowRenderer
        key={rows[index]?.id || index}
        row={rows[index]}
        index={index}
        style={style}
        focusedCell={focusedCell}
        handleCellClick={handleCellClick}
        handleContextMenu={handleContextMenu}
        getTouchHandlers={getTouchHandlers}
        zebraStriping={zebraStriping}
        focusedColIndex={focusedColIndex}
        focusedRowIndex={focusedRowIndex}
        setFocusedRowIndex={setFocusedRowIndex}
        setFocusedColIndex={setFocusedColIndex}
        columnHighlightMode={columnHighlightMode}
        rowNumberWidth={rowNumberWidth}
        rowHeight={computedRowHeight}
      />
    ),
    [
      rows,
      focusedCell,
      handleCellClick,
      handleContextMenu,
      getTouchHandlers,
      zebraStriping,
      focusedColIndex,
      focusedRowIndex,
      setFocusedRowIndex,
      setFocusedColIndex,
      columnHighlightMode,
      rowNumberWidth,
      computedRowHeight,
    ]
  );

  const shouldVirtualize = rows.length > 10;
  const virtualListHeight = Math.min(listHeight, rows.length * computedRowHeight);

  return (
    <div style={fontVars}>
      <AnimatePresence initial={false}>
        {shouldVirtualize ? (
          <List
            height={virtualListHeight}
            itemCount={rows.length}
            itemSize={computedRowHeight}
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
    </div>
  );
};

export default GridTableRows;
