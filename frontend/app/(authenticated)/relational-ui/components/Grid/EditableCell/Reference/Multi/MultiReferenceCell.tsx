import React, { useState, useEffect } from "react";
import MultiReferenceList from "./MultiReferenceList";
import MultiReferenceTag from "./MultiReferenceTag";

interface ReferenceOption {
  id: string;
  name: string;
}

interface MultiReferenceCellProps {
  value: string[]; // array of ids
  rowId: string;
  column: { referenceData?: ReferenceOption[]; accessorKey: string };
  onSave: (rowId: string, key: string, value: string[]) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize: number;
  rowHeight: number;
}

const MultiReferenceCell: React.FC<MultiReferenceCellProps> = ({
  value = [],
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
  fontSize,
  rowHeight,
}) => {
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value || []);
  }, [value]);

  // Save on edit complete
  const handleEditComplete = () => {
    onSave(rowId, column.accessorKey, selected);
    onEditComplete?.();
  };

  // Get label objects for display
  const options = column.referenceData || [];
  const selectedTags = options.filter((opt) => selected.includes(opt.id));

  if (editing) {
    return (
      <MultiReferenceList
        value={selected}
        options={options}
        onChange={setSelected}
        onEditComplete={handleEditComplete}
        autoFocus
        fontSize={fontSize}
        rowHeight={rowHeight}
      />
    );
  }

  // Not editing: show as consistent tags
  return (
    <div
      className="flex flex-wrap gap-1 px-2 py-1 cursor-pointer min-h-full"
      style={{ fontSize, minHeight: rowHeight }}
      onDoubleClick={onStartEdit}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onStartEdit?.()}
    >
      {selectedTags.length === 0 && (
        <span className="text-gray-400">—</span>
      )}
      {selectedTags.map((opt) => (
        <span
          key={opt.id}
          className="inline-flex items-center px-2 py-0 font-medium border rounded truncate bg-indigo-100 text-indigo-800 border-indigo-300"
          style={{
            maxWidth: "100%",
            fontWeight: 500,
            fontSize,
            height: rowHeight - 6,
            minHeight: rowHeight - 6,
            lineHeight: `${rowHeight}px`,
          }}
        >
          <MultiReferenceTag
            value={opt.name}
            fontSize={fontSize}
            rowHeight={rowHeight}
            truncate
          />
        </span>
      ))}
    </div>
  );
};

export default MultiReferenceCell;
