"use client";

import React from "react";
import { XIcon } from "lucide-react";

interface TableSelectorPanelProps {
  isOpen: boolean;
  tables: string[];
  activeTable: string | null;
  onClose: () => void;
  onSelectTable: (tableName: string) => void;
}

export default function TableSelectorPanel({
  isOpen,
  tables,
  activeTable,
  onClose,
  onSelectTable,
}: TableSelectorPanelProps) {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
      role="dialog"
      aria-label="Table Selector"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📁 Tables</h2>
        <button onClick={onClose} aria-label="Close panel">
          <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onSelectTable(table)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
              table === activeTable
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  );
}
