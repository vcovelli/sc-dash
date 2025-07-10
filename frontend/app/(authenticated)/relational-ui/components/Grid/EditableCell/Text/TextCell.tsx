"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

type CellValue = string | number | null;

interface TextCellProps {
  value: CellValue;
  rowId: number;
  column: CustomColumnDef<unknown>;
  onSave: (id: number, key: string, value: CellValue) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize?: number;
  rowHeight?: number;
}

const TextCell = React.memo(function TextCell({
  value,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
  fontSize = 14,
  rowHeight = 36,
}: TextCellProps) {
  const [val, setVal] = useState<CellValue>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (val !== value) {
      onSave(rowId, column.accessorKey, val);
    }
    requestAnimationFrame(() => onEditComplete?.());
  }, [val, value, onSave, rowId, column.accessorKey, onEditComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        inputRef.current?.blur();
      }
      if (e.key === "Escape") {
        setVal(value);
        requestAnimationFrame(() => onEditComplete?.());
      }
    },
    [value, onEditComplete]
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val ?? ""}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ fontSize, height: rowHeight, minHeight: rowHeight }}
        className="w-full h-full px-2 py-1 border border-gray-300 rounded outline-none bg-white text-black dark:bg-white dark:text-black"
      />
    );
  }

  const displayValue = value == null || value === "" ? "" : String(value);

  return (
    <div
      className="w-full h-full px-2 py-1 flex items-center min-w-0 select-none cursor-pointer"
      style={{ fontSize, minHeight: rowHeight, height: rowHeight }}
      tabIndex={0}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onStartEdit?.();
      }}
    >
      <span
        className="block truncate min-w-0 max-w-full whitespace-nowrap"
        style={{ width: "100%" }}
        title={typeof value === "string" && value.length > 0 ? value : undefined}
      >
        {displayValue || <span className="text-gray-400">—</span>}
      </span>
    </div>
  );
});

export default TextCell;
