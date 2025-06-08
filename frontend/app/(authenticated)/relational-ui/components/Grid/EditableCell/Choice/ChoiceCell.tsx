import React, { useState, useCallback } from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import ChoiceTag from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceTag";
import ChoiceList from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell/Choice/ChoiceList";

interface ChoiceOption {
  id: string;
  name: string;
  color?: string;
}

interface ChoiceCellProps {
  value: any;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (id: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize: number;
  rowHeight: number;
  onAddChoice?: (newName: string) => Promise<ChoiceOption | null> | ChoiceOption | null;
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
  const [value, setValue] = useState(initialValue);

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
              const opt = findOption(value);
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
  return (
    <div style={{ minWidth: 160 }}>
      <ChoiceList
        value={value}
        options={normalizedChoices}
        onChange={handleChange}
        onEditComplete={onEditComplete}
        autoFocus
        openOnFocus
        // You can pass a getColor that uses color if you want in edit mode too, but default is fine for now
        fontSize={fontSize}
        rowHeight={rowHeight}
        onAddChoice={onAddChoice}
      />
    </div>
  );
});

export default ChoiceCell;
