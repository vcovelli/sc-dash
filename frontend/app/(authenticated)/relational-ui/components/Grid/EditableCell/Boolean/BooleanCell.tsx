"use client";

import React, { useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

interface BooleanCellProps {
  value: boolean;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: boolean) => void;
  editing?: boolean;
  onEditComplete?: () => void;
}

const BooleanCell: React.FC<BooleanCellProps> = React.memo(
  ({ value, rowId, column, onSave, editing = false, onEditComplete }) => {
    const handleToggle = useCallback(() => {
      onSave(rowId, column.accessorKey, !value);
      onEditComplete?.();
    }, [value, rowId, column.accessorKey, onSave, onEditComplete]);

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
);

export default BooleanCell;
