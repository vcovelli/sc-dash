"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

interface NumberCellProps {
  value: number;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: number) => void;
  editing?: boolean;
  onEditComplete?: () => void;
}

const NumberCell: React.FC<NumberCellProps> = React.memo(
  ({ value: initialValue, rowId, column, onSave, editing = false, onEditComplete }) => {
    const [value, setValue] = useState<string>(initialValue?.toString() ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setValue(initialValue?.toString() ?? "");
    }, [initialValue]);

    useEffect(() => {
      if (editing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [editing]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    }, []);

    const commitSave = useCallback(() => {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        onSave(rowId, column.accessorKey, parsed);
      }
    }, [value, rowId, column.accessorKey, onSave]);

    const handleBlur = useCallback(() => {
      commitSave();
      setTimeout(() => onEditComplete?.(), 0);
    }, [commitSave, onEditComplete]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitSave();
        setTimeout(() => {
          onEditComplete?.(); // Triggers editingCell reset
          const cell = document.querySelector("[data-cell-focus='below']") as HTMLElement;
          cell?.focus(); // Ensure movement down
        }, 0);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setValue(initialValue?.toString() ?? "");
        setTimeout(() => onEditComplete?.(), 0);
      }
    }, [commitSave, initialValue, onEditComplete]);

    const formattedValue =
      typeof initialValue === "number" ? initialValue.toLocaleString() : "";

    return editing ? (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full h-full px-2 py-1 text-sm border border-gray-300 rounded text-right 
                   bg-white text-black dark:bg-white dark:text-black focus:ring-2 focus:ring-blue-500 outline-none"
      />
    ) : (
      <div className="text-right px-2 text-sm text-gray-800 dark:text-gray-100 select-none">
        {formattedValue}
      </div>
    );
  }
);

export default NumberCell;
