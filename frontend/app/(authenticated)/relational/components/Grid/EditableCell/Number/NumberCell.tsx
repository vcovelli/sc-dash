"use client";

import React, { useEffect, useState } from "react";
import { CustomColumnDef } from "@relational/lib/types";

export default function NumberCell({
  value: initialValue,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
}: {
  value: number;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: number) => void;
  editing?: boolean;
  onEditComplete?: () => void;
}) {
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleBlur = () => {
    const parsed = parseFloat(String(value));
    if (!isNaN(parsed)) {
      onSave(rowId, column.accessorKey, parsed);
    }
    onEditComplete?.();
  };

  return editing ? (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      className="w-full px-2 py-1 border rounded text-right"
      autoFocus
    />
  ) : (
    <div className="text-right px-2">{initialValue ?? ""}</div>
  );
}
