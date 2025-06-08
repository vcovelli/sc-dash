"use client";

import React, { useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface BooleanCellProps {
  value: boolean;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: boolean) => void;
}

const BooleanCell: React.FC<BooleanCellProps> = React.memo(
  ({ value, rowId, column, onSave }) => {
    const handleToggle = useCallback(() => {
      onSave(rowId, column.accessorKey, !value);
    }, [value, rowId, column.accessorKey, onSave]);

    return (
      <div className="flex items-center justify-center w-full h-full">
        <input
          type="checkbox"
          checked={!!value}
          onChange={handleToggle}
          className="w-4 h-4 cursor-pointer"
          tabIndex={0}
          style={{ accentColor: "#2563eb" }} // optional: blue checkbox for Tailwind blue-600
        />
      </div>
    );
  }
);

export default BooleanCell;
