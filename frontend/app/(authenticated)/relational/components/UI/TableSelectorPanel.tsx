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
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl border-r z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">📁 Tables</h2>
        <button onClick={onClose}>
          <XIcon className="w-5 h-5 text-gray-500 hover:text-black" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {tables.map((table) => (
          <button
            key={table}
            onClick={() => onSelectTable(table)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              table === activeTable
                ? "bg-blue-100 text-blue-700 font-medium"
                : "hover:bg-gray-100"
            }`}
          >
            {table}
          </button>
        ))}
      </div>
    </div>
  );
}
