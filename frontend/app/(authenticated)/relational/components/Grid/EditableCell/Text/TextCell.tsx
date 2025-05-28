import React, { useEffect, useRef, useState } from "react";
import { CustomColumnDef } from "@relational/lib/types";

export default function TextCell({
  value,
  editing = false,
  row,
  rowId,
  column,
  onSave,
  onEditComplete,
  onStartEdit,
}: {
  value: any;
  row: any;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}) {
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          if (val !== value) onSave(rowId, column.accessorKey, val);
          setTimeout(() => onEditComplete?.(), 0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.blur();
          if (e.key === "Escape") {
            setVal(value);
            inputRef.current?.blur();
            requestAnimationFrame(() => onEditComplete?.());
          }
        }}
        className="w-full h-full px-2 py-1 text-sm border border-gray-300 rounded outline-none"
      />
    );
  }

  return (
    <div
      className="w-full h-full px-2 py-1 text-sm select-none cursor-pointer"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🧲 TextCell double-clicked");
        onStartEdit?.();
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onStartEdit?.();
      }}
    >
      {value}
    </div>
  );
}
