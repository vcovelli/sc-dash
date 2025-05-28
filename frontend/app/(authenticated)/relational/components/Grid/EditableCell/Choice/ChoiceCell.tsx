import React, { useEffect, useState } from "react";
import { CustomColumnDef } from "@relational/lib/types";
import ChoiceTag from "@relational/components/Grid/EditableCell/Choice/ChoiceTag";
import ChoiceList from "@relational/components/Grid/EditableCell/Choice/ChoiceList";

interface ChoiceOption {
  id: string;
  name: string;
}

export default function ChoiceCell({
  value: initialValue,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
}: {
  value: any;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (selectedName: string) => {
    let valueToSave = selectedName;

    if (Array.isArray(column.choices) && typeof column.choices[0] === "object") {
      const match = (column.choices as ChoiceOption[]).find(opt => opt.name === selectedName);
      valueToSave = match?.name ?? selectedName;
    }

    const valueChanged = valueToSave !== initialValue;

    setValue(valueToSave);
    onSave(rowId, column.accessorKey, valueToSave);
    setTimeout(() => onEditComplete?.(), 0);
    };

  if (editing) {
    return (
      <ChoiceList
        value={value}
        options={column.choices || []}
        onChange={handleChange}
        onEditComplete={onEditComplete}
        autoFocus
        getColor={(val) => {
          switch (val) {
            case "Pending":
              return "bg-red-100 text-red-800 border-red-300";
            case "Delivered":
              return "bg-green-100 text-green-800 border-green-300";
            case "In Transit":
              return "bg-yellow-100 text-yellow-800 border-yellow-300";
            default:
              return "bg-gray-100 text-gray-800 border-gray-300";
          }
        }}
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
      <ChoiceTag value={initialValue} />
    </div>
  );
}
