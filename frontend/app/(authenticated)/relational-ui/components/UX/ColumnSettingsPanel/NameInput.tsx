import React from "react";

export default function NameInput({
  value,
  onChange,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  const typeLabel = (type?.charAt(0).toUpperCase() + type?.slice(1) + " Column Label") || "Column Label";
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
        {typeLabel}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        placeholder="Column name"
      />
    </div>
  );
}
