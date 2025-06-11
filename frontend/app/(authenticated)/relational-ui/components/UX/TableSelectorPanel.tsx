"use client";

import React from "react";
import { XIcon, MenuIcon } from "lucide-react";
import { getFontVars } from "@/components/FontSizeVarsProvider";

// Panel widths
const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 48;

interface TableSelectorPanelProps {
  isOpen: boolean;
  tables: string[];
  activeTable: string | null;
  onClose: () => void;
  onSelectTable: (tableName: string) => void;
  tableFontSize: string;
}

export default function TableSelectorPanel({
  isOpen,
  tables,
  activeTable,
  onClose,
  onSelectTable,
  tableFontSize,
}: TableSelectorPanelProps) {
  const fontVars = getFontVars(tableFontSize || "base");

  return (
    <div
      className="h-full flex flex-col relative transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
      style={{
        width: isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
        minWidth: isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
        ...fontVars,
      }}
    >
      {/* Header & Close/Open button */}
      {isOpen ? (
        <>
          <div className="flex flex-col items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between w-full mt-2 px-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100" style={{ fontSize: "var(--h2)" }}>
                📁 Tables
              </h2>
              <button onClick={onClose} aria-label="Close panel">
                <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white" />
              </button>
            </div>
          </div>
          {/* Table List */}
          <div className="p-4 space-y-2 flex-1 overflow-auto">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => onSelectTable(table)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  table === activeTable
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                style={{ fontSize: "var(--body)" }}
              >
                {table.charAt(0).toUpperCase() + table.slice(1)}
              </button>
            ))}
          </div>
          {/* Branding - only when open */}
          <div className="absolute bottom-4 left-0 w-full flex justify-center">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-tight select-none" style={{ fontSize: "var(--small)" }}>
              Powered by:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">SupplyWise</span>
            </span>
          </div>
        </>
      ) : (
        // When collapsed, show only a menu icon centered vertically for reopening
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open Table Selector"
          >
            <MenuIcon className="w-6 h-6 text-blue-600" />
          </button>
        </div>
      )}
    </div>
  );
}
