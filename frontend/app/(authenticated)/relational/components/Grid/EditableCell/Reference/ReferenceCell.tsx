import React, { useEffect, useState } from "react";
import { CustomColumnDef } from "@relational/lib/types";
import ChoiceTag from "@relational/components/Grid/EditableCell/Choice/ChoiceTag";
import ReferenceList from "@relational/components/Grid/EditableCell/Reference/ReferenceList";

type ReferenceOption = { id: string; name: string };

export default function ReferenceCell({
  value: initialValue,
  row,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
}: {
  value: any;
  row: any;
  rowId: string;
  column: CustomColumnDef<any> & { referenceData?: ReferenceOption[] };
  onSave: (id: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const display =
    Array.isArray(column.referenceData) &&
    typeof column.referenceData[0] === "object" &&
    "id" in column.referenceData[0]
      ? column.referenceData.find((item) => item.id === initialValue)?.name ?? "Unknown"
      : initialValue;

  if (editing) {
    return (
      <ReferenceList
        value={value}
        options={column.referenceData || []}
        onChange={(newId) => {
          setValue(newId);
          onSave(rowId, column.accessorKey, newId);
        }}
        onEditComplete={onEditComplete} // ✅ delegate closing responsibility to ReferenceList
        autoFocus
      />
    );
  }

  return (
    <div
      className="w-full h-full px-2 py-1 text-sm cursor-default select-none"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onStartEdit?.();
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onStartEdit?.();
        }
      }}
    >
      <ChoiceTag value={display} />
    </div>
  );
}
