"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";
import ReferenceList from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Reference/ReferenceList";

type ReferenceOption = { id: string; name: string };

const ReferenceCell: React.FC<{
  value: any;
  row: any;
  rowId: string;
  column: CustomColumnDef<any> & { referenceData?: ReferenceOption[] };
  onSave: (id: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}> = React.memo(
  ({ value: initialValue, row, rowId, column, onSave, editing = false, onEditComplete, onStartEdit }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    const display = useMemo(() => {
      if (!column.referenceData) return initialValue;
      const match = column.referenceData.find((item) => String(item.id) === String(initialValue));
      return match?.name ?? "—";
    }, [initialValue, column.referenceData]);

    const handleChange = useCallback(
      (newId: string) => {
        setValue(newId);
        onSave(rowId, column.accessorKey, newId);
      },
      [onSave, rowId, column.accessorKey]
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit?.();
      },
      [onStartEdit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onStartEdit?.();
        }
      },
      [onStartEdit]
    );

    if (editing) {
      return (
        <ReferenceList
          value={value}
          options={column.referenceData || []}
          onChange={handleChange}
          onEditComplete={onEditComplete}
          autoFocus
        />
      );
    }

    return (
      <div
        className="w-full h-full px-2 py-1 text-sm cursor-pointer select-none outline-none focus:ring-2 focus:ring-blue-500"
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <ChoiceTag value={display} />
      </div>
    );
  }
);

export default ReferenceCell;
