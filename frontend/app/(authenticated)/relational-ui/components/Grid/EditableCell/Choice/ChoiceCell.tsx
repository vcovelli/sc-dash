import React, { useState, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";
import ChoiceList from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceList";

// --- Option interface ---
interface ChoiceOption {
  id: string;
  name: string;
  color?: string;
}

interface ChoiceCellProps {
  value: string | string[] | null;
  rowId: string;
  column: CustomColumnDef<unknown>;
  onSave: (id: string, key: string, value: string | string[]) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize: number;
  rowHeight: number;
  onAddChoice?: (newName: string, color?: string) => Promise<ChoiceOption | null> | ChoiceOption | null;
}



const ChoiceCell = React.memo(function ChoiceCell({
  value: initialValue,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
  fontSize,
  rowHeight,
  onAddChoice,
}: ChoiceCellProps) {
  // ---- DEBUG LOG: at top of render ----
  console.log("[ChoiceCell] rendering col:", column.accessorKey, {
    ownOnAddChoice: typeof onAddChoice,
    colOnAddChoice: typeof column.onAddChoice,
    normalizedChoices: column.choices,
  });

  const [value, setValue] = useState<string | string[] | null>(initialValue);

  // Normalize choices to [{id, name, color}]
  const choices = Array.isArray(column.choices) ? column.choices : [];
  const normalizedChoices: ChoiceOption[] =
    typeof choices[0] === "object"
      ? (choices as ChoiceOption[])
      : (choices as string[]).map((opt) => ({ id: opt, name: opt }));

  // Helper to find option by id
  const findOption = (id: string) =>
    normalizedChoices.find((c) => c.id === id);

  // Save handler for changes
  const handleChange = useCallback(
    (selectedId: string) => {
      setValue(selectedId);
      onSave(rowId, column.accessorKey, selectedId);
      requestAnimationFrame(() => onEditComplete?.());
    },
    [rowId, column.accessorKey, onSave, onEditComplete]
  );

  // --- Blank cell display (not editing, no value) ---
  if (!editing && (!value || value === "" || (Array.isArray(value) && value.length === 0))) {
    return (
      <div
        className="w-full h-full"
        style={{ minHeight: rowHeight, fontSize }}
        tabIndex={0}
        onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); onStartEdit?.(); }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            onStartEdit?.();
          }
        }}
      />
    );
  }

  // --- Display mode (not editing) ---
  if (!editing) {
    const isMulti = Array.isArray(value);

    return (
      <div
        className={
          isMulti
            ? "flex items-center flex-wrap gap-1 h-full w-full min-w-0 justify-start"
            : "flex items-center justify-center w-full h-full min-w-0"
        }
        style={{
          fontSize,
          height: rowHeight,
          minHeight: rowHeight,
          lineHeight: `${rowHeight}px`,
          padding: 0,
        }}
        tabIndex={0}
        onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); onStartEdit?.(); }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            onStartEdit?.();
          }
        }}
      >
        {isMulti
          ? value.map((v: string) => {
              const opt = findOption(v);
              return (
                <ChoiceTag
                  key={v}
                  value={opt?.name ?? v}
                  color={opt?.color}
                  fontSize={fontSize}
                  rowHeight={rowHeight}
                  truncate
                />
              );
            })
          : (() => {
              const opt = findOption(value ?? "");
              return (
                <ChoiceTag
                  value={opt?.name ?? value}
                  color={opt?.color}
                  fontSize={fontSize}
                  rowHeight={rowHeight}
                  truncate
                />
              );
            })()}
      </div>
    );
  }

  // --- Edit mode ---
  // --- DEBUG LOG: Before rendering ChoiceList ---
  console.log("[ChoiceCell] Passing onAddChoice to ChoiceList:", onAddChoice || column.onAddChoice);

  return (
    <div style={{ minWidth: 160 }}>
      <ChoiceList
        value={Array.isArray(value) ? value[0] ?? "" : value ?? ""}
        options={normalizedChoices}
        onChange={handleChange}
        onEditComplete={onEditComplete}
        autoFocus
        openOnFocus
        fontSize={fontSize}
        rowHeight={rowHeight}
        onAddChoice={onAddChoice || column.onAddChoice}
      />
    </div>
  );
});

export default ChoiceCell;
