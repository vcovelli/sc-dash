import React from "react";
import { ColumnDataType } from "@/app/(authenticated)/relational-ui/components/Sheet";

const COLUMN_TYPES: ColumnDataType[] = [
  "text", "number", "currency", "boolean", "choice", "reference", "date", "link", "formula", "attachment",
];

export default function TypeSelector({
  value,
  onChange,
}: {
  value: ColumnDataType;
  onChange: (v: ColumnDataType) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">Column Type</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as ColumnDataType)}
        className="w-full border rounded-lg px-3 py-2"
      >
        {COLUMN_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
