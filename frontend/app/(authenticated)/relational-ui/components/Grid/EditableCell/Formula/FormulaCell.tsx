"use client";

import React from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface FormulaCellProps {
  value: string | number | null | undefined;
  rowId: number;
  column: CustomColumnDef<unknown>;
  editing?: boolean;
  onSave?: (id: number, key: string, value: string) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize?: number;
  rowHeight?: number;
}

const FormulaCell: React.FC<FormulaCellProps> = React.memo(
  ({
    value,
    fontSize = 13,
    rowHeight = 36,
  }) => {
    const displayValue = String(value ?? "");

    return (
      <div
        className="text-gray-700 font-mono italic px-2 py-0.5 bg-gray-50 dark:bg-gray-900 rounded w-full truncate select-none"
        style={{
          fontSize,
          minHeight: rowHeight,
          height: rowHeight,
          lineHeight: `${rowHeight}px`,
          display: "flex",
          alignItems: "center",
        }}
        title={displayValue.length > 32 ? displayValue : undefined}
        tabIndex={0}
      >
        {displayValue}
      </div>
    );
  }
);

FormulaCell.displayName = "FormulaCell";

export default FormulaCell;
