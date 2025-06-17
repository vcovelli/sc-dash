"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface CurrencyCellProps {
  value: number | null;
  rowId: string;
  column: CustomColumnDef<unknown>;
  onSave: (id: string, key: string, value: number) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  fontSize: number;
  rowHeight: number;
}

const CurrencyCell: React.FC<CurrencyCellProps> = React.memo(
  ({
    value: initialValue,
    rowId,
    column,
    onSave,
    editing = false,
    onEditComplete,
    fontSize,
    rowHeight,
  }) => {
    const [value, setValue] = useState(initialValue?.toString() ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setValue(initialValue?.toString() ?? "");
    }, [initialValue]);

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [editing]);

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

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitSave();
          setTimeout(() => {
            onEditComplete?.();
            const cell = document.querySelector("[data-cell-focus='below']") as HTMLElement;
            cell?.focus();
          }, 0);
        }

        if (e.key === "Escape") {
          e.preventDefault();
          setValue(initialValue?.toString() ?? "");
          setTimeout(() => onEditComplete?.(), 0);
        }
      },
      [commitSave, initialValue, onEditComplete]
    );

    const currencyCode = column.currencyCode || "USD";

    // Skip formatting if value is null/undefined/blank
    const showFormatted =
      typeof initialValue === "number" && !isNaN(initialValue);

    const formatted = showFormatted
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(initialValue)
      : null;

    return editing ? (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full h-full text-sm text-right px-2 py-1 border border-gray-300 rounded outline-none
                 bg-white text-black dark:bg-white dark:text-black focus:ring-2 focus:ring-blue-500"
        style={{ fontSize, height: rowHeight, minHeight: rowHeight }}
      />
    ) : (
      <div
        tabIndex={0}
        data-row-id={rowId}
        data-col-id={column.accessorKey}
        className="text-right px-2 text-sm text-gray-800 dark:text-gray-100 select-none"
        style={{
          fontSize,
          height: rowHeight,
          minHeight: rowHeight,
          lineHeight: `${rowHeight}px`,
        }}
      >
        {formatted ?? <span className="text-gray-400 dark:text-gray-600"></span>}
      </div>
    );
  }
);

CurrencyCell.displayName = "CurrencyCell";

export default CurrencyCell;
