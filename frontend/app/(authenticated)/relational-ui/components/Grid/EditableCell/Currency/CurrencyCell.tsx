"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface CurrencyCellProps {
  value: number;
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

    // Log when initialValue or currencyCode changes
    useEffect(() => {
      console.log(`[CurrencyCell] initialValue changed:`, initialValue);
      setValue(initialValue?.toString() ?? "");
    }, [initialValue]);

    useEffect(() => {
      console.log(`[CurrencyCell] column.currencyCode changed:`, column.currencyCode);
    }, [column.currencyCode]);

    useEffect(() => {
      if (editing) {
        console.log(`[CurrencyCell] Editing mode enabled for rowId=${rowId}`);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [editing, rowId]);

    const commitSave = useCallback(() => {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        console.log(`[CurrencyCell] commitSave: saving value`, parsed, `for rowId=${rowId}, key=${column.accessorKey}`);
        onSave(rowId, column.accessorKey, parsed);
      } else {
        console.log(`[CurrencyCell] commitSave: invalid number, skipping save. value=`, value);
      }
    }, [value, rowId, column.accessorKey, onSave]);

    const handleBlur = useCallback(() => {
      console.log(`[CurrencyCell] onBlur triggered for rowId=${rowId}`);
      commitSave();
      setTimeout(() => onEditComplete?.(), 0);
    }, [commitSave, onEditComplete, rowId]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          console.log(`[CurrencyCell] Enter pressed - commitSave and move down for rowId=${rowId}`);
          commitSave();
          setTimeout(() => {
            onEditComplete?.();
            const cell = document.querySelector("[data-cell-focus='below']") as HTMLElement;
            cell?.focus();
          }, 0);
        }

        if (e.key === "Escape") {
          e.preventDefault();
          console.log(`[CurrencyCell] Escape pressed - cancel edit for rowId=${rowId}`);
          setValue(initialValue?.toString() ?? "");
          setTimeout(() => onEditComplete?.(), 0);
        }
      },
      [commitSave, initialValue, onEditComplete, rowId]
    );

    // Pick the currency code set in the column, fallback to USD
    const currencyCode = column.currencyCode || "USD";

    // Always parse to number, fallback to 0
    const parsed = Number(initialValue);
    const safeValue =
      typeof parsed === "number" && !isNaN(parsed) && parsed !== null && parsed !== undefined
        ? parsed
        : 0;

    // Log on each render
    console.log("[CurrencyCell] render", {
      rowId,
      initialValue,
      currencyCode,
      safeValue,
      editing,
    });

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);

    return editing ? (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => {
          console.log(`[CurrencyCell] input changed to`, e.target.value, `for rowId=${rowId}`);
          setValue(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full h-full text-sm text-right px-2 py-1 border border-gray-300 rounded outline-none
                 bg-white text-black dark:bg-white dark:text-black focus:ring-2 focus:ring-blue-500"
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
        {formatted}
      </div>
    );
  }
);

CurrencyCell.displayName = "CurrencyCell";

export default CurrencyCell;