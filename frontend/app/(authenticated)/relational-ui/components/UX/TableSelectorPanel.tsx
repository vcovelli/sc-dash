"use client";

import React, { useState } from "react";
import { XIcon, MenuIcon, PlusIcon } from "lucide-react";
import { getFontVars } from "@/components/FontSizeVarsProvider";

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 48;

interface TableSelectorPanelProps {
  isOpen: boolean;
  tables: string[];
  activeTable: string | null;
  onClose: () => void;
  onSelectTable: (tableName: string) => void;
  tableFontSize: string;
  isProUser: boolean;
  onAddTable: () => void;
  onUpgrade: () => void;
}

export default function TableSelectorPanel({
  isOpen,
  tables,
  activeTable,
  onClose,
  onSelectTable,
  tableFontSize,
  isProUser,
  onAddTable,
  onUpgrade,
}: TableSelectorPanelProps) {
  const fontVars = getFontVars(tableFontSize || "base");
  const [showPaywallMsg, setShowPaywallMsg] = useState(false);

  // Hide paywall message on table select, close, or table add for pro users
  React.useEffect(() => {
    if (!isOpen) setShowPaywallMsg(false);
  }, [isOpen, activeTable]);

  const handleAddTable = () => {
    if (isProUser) {
      onAddTable();
    } else {
      setShowPaywallMsg(true);
    }
  };

  return (
    <div
      className="h-full flex flex-col relative transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
      style={{
        width: isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
        minWidth: isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
        ...fontVars,
      }}
    >
      {isOpen ? (
        <>
          {/* Header */}
          <div className="flex flex-col items-center py-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between w-full mt-2 px-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100" style={{ fontSize: "var(--h2)" }}>
                📁 Tables
              </h2>
              <button onClick={onClose} aria-label="Close panel">
                <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white" />
              </button>
            </div>
          </div>

          {/* Table List or Empty State */}
          <div className="p-4 space-y-2 flex-1 overflow-auto">
            {tables.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-600 text-sm text-center mt-8">
                <div className="text-2xl mb-2">😕</div>
                <div>No tables yet.</div>
                <div className="mt-1 text-xs">
                  Use the <span className="font-semibold">Schema Wizard</span> to create your first table.
                </div>
              </div>
            ) : (
              tables.map((table) => (
                <button
                  key={table}
                  onClick={() => {
                    setShowPaywallMsg(false);
                    onSelectTable(table);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    table === activeTable
                      ? "bg-blue-100 dark:bg-blue-800/80 text-blue-700 dark:text-blue-200 font-medium shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  }`}
                  style={{ fontSize: "var(--body)" }}
                >
                  {table.charAt(0).toUpperCase() + table.slice(1)}
                </button>
              ))
            )}
          </div>

          {/* Add Table + Paywall */}
          <div className="px-4 pb-5 pt-2">
            <div
              className={`flex flex-col items-center gap-2 rounded-xl py-3 px-2
                ${isProUser ? "bg-blue-50 dark:bg-blue-950/40" : "bg-gray-100 dark:bg-gray-800/60"}
              `}
            >
              <button
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-base
                  transition
                  ${isProUser
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-400 hover:bg-blue-500/20 dark:hover:bg-blue-700/30 hover:text-blue-700 dark:hover:text-blue-300"
                  }
                `}
                onClick={handleAddTable}
                style={{ fontSize: "var(--body)", cursor: isProUser ? "pointer" : "not-allowed" }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Table
              </button>
              {/* Show paywall message only if user clicks Add Table and is not Pro */}
              {!isProUser && showPaywallMsg && (
                <div className="text-xs text-center text-red-500 font-medium">
                  Only Pro users can add tables.{" "}
                  <a
                    href="https://supplywise.ai/profile/plans/pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Upgrade
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Branding */}
          <div className="pb-3">
            <div className="flex w-full justify-center pt-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-tight select-none" style={{ fontSize: "var(--small)" }}>
                Powered by{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">SupplyWise</span>
              </span>
            </div>
          </div>
        </>
      ) : (
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
