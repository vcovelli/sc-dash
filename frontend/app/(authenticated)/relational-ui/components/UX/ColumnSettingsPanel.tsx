"use client";

import React, { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { ColumnDataType, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { getFontVars } from "@/components/FontSizeVarsProvider";

const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "CHF", label: "Swiss Franc (Fr)" },
  { code: "CNY", label: "Chinese Yuan (¥)" },
  { code: "INR", label: "Indian Rupee (₹)" },
];

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

interface ColumnSettingsPanelProps {
  isOpen: boolean;
  column: CustomColumnDef<any> | null;
  onClose: () => void;
  onUpdate: (updated: CustomColumnDef<any>) => void;
}

export default function ColumnSettingsPanel({
  isOpen,
  column,
  onClose,
  onUpdate,
}: ColumnSettingsPanelProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnDataType>("text");
  const [formula, setFormula] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  // === Use context ===
  const { fontSizeIdx, setFontSizeIdx, presets, fontSize, rowHeight, zebraStriping, setZebraStriping } = useTableSettings();

  // Map numeric fontSize (from TableSettingsContext) to preset value
  // Use the correct preset value for getFontVars
  const preset = presets[fontSizeIdx];
  const fontVars = getFontVars(preset.value);

  useEffect(() => {
    if (!column) return;
    setName(column.header?.toString() || "");
    setType(column.type || "text");
    setFormula(column.type === "formula" && "formula" in column ? (column as any).formula || "" : "");
    setCurrencyCode(column.currencyCode || "USD");
  }, [column]);

  const handleSave = () => {
    if (!column || !name.trim()) return;
    const updated: CustomColumnDef<any> = {
      ...column,
      header: name.trim(),
      type,
      ...(type === "currency" && { currencyCode }),
      ...(type === "formula" && { formula }),
    };
    onUpdate(updated);
    onClose();
  };

  const resetTableFontSize = () => setFontSizeIdx(2); // 2 = 'base' preset

  return (
    <div
      className="flex flex-col h-full w-full bg-white dark:bg-gray-900 overflow-y-auto max-h-screen"
      style={fontVars}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
        <h2
          className="text-lg font-semibold dark:text-white flex items-center gap-2"
          style={{ fontSize: "var(--h2)" }}
        >
          <span className="text-xl">⚙️</span> Column Settings
        </h2>
        <button onClick={onClose} aria-label="Close">
          <XIcon className="w-5 h-5 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>
            Column Label
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style={{ fontSize: "var(--body)" }}
            placeholder="Column name"
          />
        </div>

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>
            Column Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ColumnDataType)}
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style={{ fontSize: "var(--body)" }}
          >
            {COLUMN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Code Selector */}
        {type === "currency" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>
              Currency Type
            </label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              style={{ fontSize: "var(--body)" }}
            >
              {CURRENCY_OPTIONS.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Formula Input */}
        {type === "formula" && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>
              Formula
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full h-20 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              style={{ fontSize: "var(--body)" }}
              placeholder="Enter formula here"
            />
          </div>
        )}

        {/* Zebra Striping Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-2 text-center" style={{ fontSize: "var(--small)" }}>
            Grid Options
          </label>
          <div className="flex justify-center">
            <button
              onClick={() => setZebraStriping(!zebraStriping)}
              className={`text-xs font-medium px-4 py-2 rounded-lg border shadow-sm transition-all duration-200
                ${
                  zebraStriping
                    ? "bg-[repeating-linear-gradient(135deg,#2563eb_0px,#2563eb_12px,#1d4ed8_12px,#1d4ed8_24px)] text-white border-blue-700"
                    : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                }`}
              style={{ fontSize: "var(--body)" }}
            >
              {zebraStriping ? "Zebra Striping On" : "Zebra Striping Off"}
            </button>
          </div>
        </div>

        {/* Font/Row Size Presets (shared/global) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>
            Table Text & Row Size
          </label>
          <div className="flex items-center gap-2 w-full justify-between mt-2">
            {presets.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => setFontSizeIdx(idx)}
                className={`flex flex-col items-center px-2 py-1 rounded transition 
                  ${
                    fontSizeIdx === idx
                      ? "bg-blue-600 text-white shadow font-bold"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-100 dark:bg-gray-800 dark:text-gray-300"
                  }
                  border ${fontSizeIdx === idx ? "border-blue-600" : "border-transparent"}`}
                style={{
                  fontSize: `${preset.fontSize}px`,
                  minWidth: 36,
                  minHeight: 36,
                  margin: "0 2px",
                }}
                type="button"
                aria-label={preset.label}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center" style={{ fontSize: "var(--small)" }}>
            <b>{presets[fontSizeIdx].label}</b> — {presets[fontSizeIdx].fontSize}px font, {presets[fontSizeIdx].rowHeight}px row
          </div>
          {/* Optionally add a reset button */}
          <div className="flex justify-center mt-2">
            <button
              onClick={resetTableFontSize}
              className="text-xs underline text-blue-500 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-100 transition"
              type="button"
              style={{ fontSize: "var(--small)" }}
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-base font-medium hover:bg-blue-700 transition-colors"
          style={{ fontSize: "var(--body)" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
