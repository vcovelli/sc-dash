import React, { useEffect, useState, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";
import ChoiceList from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceList";

interface ChoiceOption {
  id: string;
  name: string;
}

const ChoiceCell = React.memo(function ChoiceCell({
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

  const handleChange = useCallback((selectedName: string) => {
    let valueToSave = selectedName;

    if (Array.isArray(column.choices) && typeof column.choices[0] === "object") {
      const match = (column.choices as ChoiceOption[]).find(opt => opt.name === selectedName);
      valueToSave = match?.name ?? selectedName;
    }

    setValue(valueToSave);

    // Always save and complete editing even if value didn't change
    onSave(rowId, column.accessorKey, valueToSave);

    requestAnimationFrame(() => onEditComplete?.());
  }, [column.choices, rowId, column.accessorKey, onSave, onEditComplete]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEdit?.();
  }, [onStartEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onStartEdit?.();
    }
  }, [onStartEdit]);

  const getColor = useCallback((val: string) => {
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
  }, []);

  if (editing) {
    return (
      <ChoiceList
        value={value}
        options={column.choices || []}
        onChange={handleChange}
        onEditComplete={onEditComplete}
        autoFocus
        openOnFocus={false} 
        getColor={getColor}
      />
    );
  }

  return (
    <div
      className="w-full h-full px-2 py-1 text-sm cursor-default select-none"
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <ChoiceTag value={initialValue} />
    </div>
  );
});

export default ChoiceCell;
