"use client";

import React from "react";
import { CustomColumnDef } from "@relational/lib/types";

export default function BooleanCell({
  value,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
}: {
  value: boolean;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: boolean) => void;
  editing?: boolean;
  onEditComplete?: () => void;
}) {
  const handleToggle = () => {
    onSave(rowId, column.accessorKey, !value);
    onEditComplete?.();
  };

  return (
    <div className="flex justify-center items-center h-full">
      <input
        type="checkbox"
        checked={!!value}
        onChange={handleToggle}
        className="w-4 h-4 cursor-pointer"
      />
    </div>
  );
}
