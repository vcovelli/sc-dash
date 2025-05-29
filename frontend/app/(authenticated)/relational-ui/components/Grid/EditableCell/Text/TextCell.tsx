import React, { useEffect, useRef, useState, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

const TextCell = React.memo(function TextCell({
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

  const handleBlur = useCallback(() => {
    if (val !== value) onSave(rowId, column.accessorKey, val);
    requestAnimationFrame(() => onEditComplete?.());
  }, [val, value, onSave, rowId, column.accessorKey, onEditComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") inputRef.current?.blur();
      if (e.key === "Escape") {
        setVal(value);
        inputRef.current?.blur();
        requestAnimationFrame(() => onEditComplete?.());
      }
    },
    [value, onEditComplete]
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={val ?? ""}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full h-full px-2 py-1 text-sm border border-gray-300 rounded outline-none
                   bg-white text-black dark:bg-white dark:text-black"
      />
    );
  }

  return (
    <div
      className="w-full h-full px-2 py-1 text-sm cursor-pointer"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
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
});

export default TextCell;
