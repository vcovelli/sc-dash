import React, { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { ColumnDataType, CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

interface ColumnSettingsPanelProps {
  isOpen: boolean;
  column: CustomColumnDef<any> | null;
  onClose: () => void;
  onUpdate: (updated: CustomColumnDef<any>) => void;
  zebraStriping: boolean;
  onToggleZebra: () => void;
}

const COLUMN_TYPES: ColumnDataType[] = [
  "text",
  "number",
  "currency",
  "boolean",
  "choice",
  "reference",
  "date",
  "link",
  "formula",
  "attachment",
];

export default function ColumnSettingsPanel({
  isOpen,
  column,
  onClose,
  onUpdate,
  zebraStriping,
  onToggleZebra,
}: ColumnSettingsPanelProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnDataType>("text");
  const [formula, setFormula] = useState("");

  useEffect(() => {
    if (!column) return;
    setName(column.header?.toString() || "");
    setType(column.type || "text");
    setFormula(column.type === "formula" && "formula" in column ? (column as any).formula || "" : "");
  }, [column?.accessorKey]);

  const handleSave = () => {
    if (!column || !name.trim()) return;

    const updated: CustomColumnDef<any> = {
      ...column,
      header: name.trim(),
      type,
      ...(type === "formula" && { formula }),
    };

    onUpdate(updated);
    onClose();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white">⚙️ Column Settings</h2>
        <button onClick={onClose} aria-label="Close">
          <XIcon className="w-5 h-5 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
            Column Label
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Column name"
          />
        </div>

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
            Column Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ColumnDataType)}
            className="w-full border rounded-lg px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Formula Input */}
        {type === "formula" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
              Formula
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full h-20 border rounded-lg px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Enter formula here"
            />
          </div>
        )}

        {/* Zebra Striping Toggle */}
        <div className="pt-4 border-t dark:border-gray-700">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-2 text-center">
            Grid Options
          </label>
          <div className="flex justify-center">
            <button
              onClick={onToggleZebra}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-200
                ${
                  zebraStriping
                    ? "border-blue-500 text-blue-800 bg-[repeating-linear-gradient(135deg,#eff6ff_0px,#eff6ff_10px,#ffffff_10px,#ffffff_20px)] dark:bg-gray-700 dark:text-blue-300 dark:border-blue-400"
                    : "border-gray-300 text-gray-600 bg-white hover:border-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                }`}
            >
              {zebraStriping ? "Zebra Striping On" : "Zebra Striping Off"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
