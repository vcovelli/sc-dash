"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";
import ReferenceList from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Reference/Single/ReferenceList";

type ReferenceOption = { id: string; name: string };

interface ReferenceCellProps {
  value: string | number | null;
  rowId: number;
  column: CustomColumnDef<unknown> & { referenceData?: ReferenceOption[]; onAddReference?: (newName: string) => Promise<ReferenceOption | null> | ReferenceOption | null; };
  onSave: (id: number, key: string, value: string | number | null) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize: number;
  rowHeight: number;
  onAddReference?: (newName: string) => Promise<ReferenceOption | null> | ReferenceOption | null;
}

const ReferenceCell: React.FC<ReferenceCellProps> = React.memo(
  ({
    value: initialValue,
    rowId,
    column,
    onSave,
    editing = false,
    onEditComplete,
    onStartEdit,
    fontSize,
    rowHeight,
    onAddReference,
  }) => {
    const [value, setValue] = useState<string | number | null>(initialValue);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    const display = useMemo(() => {
      if (!column.referenceData) return initialValue == null ? "—" : String(initialValue);
      const match = column.referenceData.find((item) => String(item.id) === String(initialValue));
      return match?.name ?? "—";
    }, [initialValue, column.referenceData]);

    const handleChange = useCallback(
      (newId: string) => {
        if (newId !== value) {
          setValue(newId);
          onSave(rowId, column.accessorKey, newId);
        }
        setTimeout(() => {
          onEditComplete?.();
        }, 100);
      },
      [value, onSave, rowId, column.accessorKey, onEditComplete]
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit?.();
      },
      [onStartEdit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
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
          value={value == null ? "" : String(value)}
          options={column.referenceData || []}
          onChange={handleChange}
          onEditComplete={onEditComplete}
          autoFocus
          fontSize={fontSize}
          rowHeight={rowHeight}
          onAddReference={onAddReference || column.onAddReference}
        />
      );
    }

    return (
      <div
        className="w-full h-full px-2 py-1 text-sm cursor-pointer select-none outline-none focus:ring-2 focus:ring-blue-500"
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          fontSize,
          height: rowHeight,
          minHeight: rowHeight,
          lineHeight: `${rowHeight}px`,
        }}
      >
        <ChoiceTag
          value={display}
          fontSize={fontSize}
          rowHeight={rowHeight}
        />
      </div>
    );
  }
);

ReferenceCell.displayName = "ReferenceCell";

export default ReferenceCell;
