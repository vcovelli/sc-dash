import React, { useState } from "react";
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
  const [showWarning, setShowWarning] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextValue = e.target.value as ColumnDataType;
    if (nextValue !== value) {
      setShowWarning(true);
    }
    onChange(nextValue);
  }

  return (
    <div>
      <label className="block font-medium mb-1 text-gray-900 dark:text-gray-200">Column Type</label>
      <select
        value={value}
        onChange={handleChange}
        className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 transition-colors"
      >
        {COLUMN_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>

      {/* Warning message */}
      {showWarning && (
        <div className="mt-3 flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z" />
          </svg>
          <div className="flex-1">
            <div className="font-semibold">Changing column type may cause data loss!</div>
            <div className="text-sm">
              If you switch types, existing data and settings may not be preserved or could be permanently lost.
              Please double-check before continuing.
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="mt-2 text-xs font-semibold text-yellow-800 dark:text-yellow-200 underline hover:text-yellow-600 dark:hover:text-yellow-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
