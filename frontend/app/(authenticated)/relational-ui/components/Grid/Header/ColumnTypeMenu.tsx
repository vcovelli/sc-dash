import React from "react";
import { ColumnDataType } from "@/app/(authenticated)/relational-ui/components/Sheet";

const columnTypes: { label: string; type: ColumnDataType }[] = [
  { label: "Text", type: "text" },
  { label: "Number", type: "number" },
  { label: "Boolean (Checkbox)", type: "boolean" },
  { label: "Date", type: "date" },
  { label: "Choice List", type: "choice" },
  { label: "Reference List", type: "reference" },
  { label: "Attachment", type: "attachment" },
  { label: "Formula", type: "formula" },
  { label: "Link", type: "link" },
];

interface Props {
  anchorPos: { x: number; y: number };
  onSelect: (type: ColumnDataType) => void;
}

export default function ColumnTypeMenu({ anchorPos, onSelect }: Props) {
  return (
    <div
      id="add-column-dropdown"
      className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded text-sm text-gray-800 dark:text-gray-200"
      style={{
        position: "fixed",
        top: anchorPos.y,
        left: anchorPos.x,
        width: 260,
        maxWidth: "95vw",
      }}
    >
      <div className="p-2">
        <div className="font-semibold mb-1 text-gray-700 dark:text-gray-100">
          Add column with type
        </div>
        {columnTypes.map((col) => (
          <div
            key={col.type}
            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => onSelect(col.type)}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  );
}
