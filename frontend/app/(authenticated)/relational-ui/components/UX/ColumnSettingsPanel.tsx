"use client";

import React, { useEffect, useState, useRef } from "react";
import { XIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { ColumnDataType, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { getFontVars } from "@/components/FontSizeVarsProvider";

// --- Color palette ---
const CHOICE_COLOR_PALETTE = [
  "#2563eb", "#22c55e", "#eab308", "#ef4444", "#db2777", "#6366f1", "#06b6d4", "#f59e42",
  "#334155", "#d4d4d8", "#fde047", "#fca5a5", "#a21caf", "#c026d3", "#b91c1c", "#64748b",
];

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
  "text", "number", "currency", "boolean", "choice", "reference", "date", "link", "formula", "attachment",
];

interface ChoiceOption {
  id: string;
  name: string;
  color?: string;
}

interface ColumnSettingsPanelProps {
  isOpen: boolean;
  column: CustomColumnDef<unknown> | null;
  onClose: () => void;
  onUpdate: (updated: CustomColumnDef<unknown>) => void;
}

function ColorSwatchGrid({ value, onChange, swatchSize }: { value?: string, onChange: (v: string) => void, swatchSize: number }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 max-w-[180px]">
      {CHOICE_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          className="rounded border border-gray-200"
          style={{
            width: swatchSize,
            height: swatchSize,
            background: color,
            boxShadow: value === color ? "0 0 0 2px #2563eb" : undefined,
          }}
          onClick={() => onChange(color)}
          tabIndex={0}
          aria-label={color}
        />
      ))}
    </div>
  );
}

export default function ColumnSettingsPanel({
  column,
  onClose,
  onUpdate,
}: ColumnSettingsPanelProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnDataType>("text");
  const [formula, setFormula] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [choices, setChoices] = useState<ChoiceOption[]>([]);
  const [newChoice, setNewChoice] = useState("");
  const [editingChoiceIdx, setEditingChoiceIdx] = useState<number | null>(null);

  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Table font/row settings
  const { fontSizeIdx, setFontSizeIdx, presets, zebraStriping, setZebraStriping } = useTableSettings();
  const preset = presets[fontSizeIdx];
  const fontVars = getFontVars(preset.value);

  useEffect(() => {
    if (!column) return;
    setName(column.header?.toString() || "");
    setType(column.type || "text");
    setFormula(column.type === "formula" && "formula" in column ? (column as CustomColumnDef<unknown> & { formula: string }).formula || "" : "");
    setCurrencyCode(column.currencyCode || "USD");
    if (column.type === "choice") {
      let arr: ChoiceOption[] = [];
      if (Array.isArray(column.choices)) {
        arr = (column.choices as ChoiceOption[]).map((c: ChoiceOption | string) =>
          typeof c === "string"
            ? { id: c, name: c }
            : { id: c.id || c.name || nanoid(), name: c.name || c.id, color: c.color }
        );
      }
      setChoices(arr);
    } else {
      setChoices([]);
    }
  }, [column]);

  // ===== CHOICE OPTIONS LOGIC =====
  const handleAddChoice = () => {
    const val = newChoice.trim();
    if (!val) return;
    setChoices(cs => [
      ...cs,
      { id: nanoid(), name: val, color: CHOICE_COLOR_PALETTE[Math.floor(Math.random() * CHOICE_COLOR_PALETTE.length)] }
    ]);
    setNewChoice("");
  };

  const handleRemoveChoice = (idx: number) => {
    setChoices(cs => cs.filter((_, i) => i !== idx));
  };

  const handleChangeChoiceName = (idx: number, newName: string) => {
    setChoices(cs => cs.map((c, i) => i === idx ? { ...c, name: newName } : c));
  };

  const handleChangeChoiceColor = (idx: number, color: string) => {
    setChoices(cs => cs.map((c, i) => i === idx ? { ...c, color } : c));
    setEditingChoiceIdx(null);
  };

  // For click outside color picker: close the palette if click outside
  useEffect(() => {
    if (editingChoiceIdx === null) return;
    function onClick(e: MouseEvent) {
      if (!colorPickerRef.current?.contains(e.target as Node)) {
        setEditingChoiceIdx(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [editingChoiceIdx]);

  // Save logic
  const handleSave = () => {
    if (!column || !name.trim()) return;
    const updated: CustomColumnDef<unknown> = {
      ...column,
      header: name.trim(),
      type,
      ...(type === "currency" && { currencyCode }),
      ...(type === "formula" && { formula }),
      ...(type === "choice" && { choices }),
    };
    onUpdate(updated);
    onClose();
  };

  const resetTableFontSize = () => setFontSizeIdx(2); // 2 = 'base' preset

  // Capitalize type for label
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1) + " Column Label";

  // --- Responsive swatch size ---
  const swatchSize = Math.max(18, Math.round((preset.rowHeight || 24) * 0.75));

  // === UI ===
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
            {typeLabel}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style={{ fontSize: "var(--body)" }}
            placeholder="Column name"
          />
        </div>

        {/* Choice Options Editor */}
        {type === "choice" && (
          <div>
            <label className="block mb-2 text-xs font-semibold">Choice Options</label>
            <div className="space-y-2">
              {choices.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="relative flex items-center gap-3 py-1 px-2 rounded group bg-white dark:bg-gray-800 border border-transparent hover:border-blue-200"
                  style={{
                    minHeight: Math.max(28, preset.rowHeight * 0.8),
                    fontSize: preset.fontSize,
                  }}
                >
                  {/* Color Square */}
                  <button
                    type="button"
                    title="Change color"
                    className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                    style={{ background: opt.color || "#ddd", borderColor: opt.color || "#bbb" }}
                    onClick={() => setEditingChoiceIdx(editingChoiceIdx === idx ? null : idx)}
                    tabIndex={0}
                  />

                  {/* POPUP ColorSwatchGrid (absolute, closes on pick or outside click) */}
                  {editingChoiceIdx === idx && (
                    <div
                      ref={colorPickerRef}
                      className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2"
                      style={{ minWidth: 144 }}
                    >
                      <ColorSwatchGrid
                        value={opt.color}
                        onChange={color => {
                          handleChangeChoiceColor(idx, color);
                          setEditingChoiceIdx(null);
                        }}
                        swatchSize={swatchSize}
                      />
                      {/* Custom hex input */}
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="color"
                          value={opt.color || "#2563eb"}
                          onChange={e => {
                            handleChangeChoiceColor(idx, e.target.value);
                            setEditingChoiceIdx(null);
                          }}
                          className="w-7 h-7 border rounded"
                          title="Custom color"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={opt.color || ""}
                          onChange={e => handleChangeChoiceColor(idx, e.target.value)}
                          placeholder="#hex"
                          className="w-16 px-1 py-0.5 border rounded text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option Name (editable) */}
                  <input
                    value={opt.name}
                    onChange={e => handleChangeChoiceName(idx, e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 border rounded text-xs overflow-hidden"
                    style={{
                      fontSize: preset.fontSize,
                      minHeight: Math.max(24, preset.rowHeight * 0.7),
                    }}
                    maxLength={30}
                  />
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveChoice(idx)}
                    className="text-red-500 text-xs ml-1 opacity-70 hover:opacity-100"
                    tabIndex={0}
                    style={{ minWidth: 20 }}
                  >✕</button>
                </div>
              ))}
            </div>
            {/* Add Option Row */}
            <div className="flex items-center gap-2 mt-3 px-2">
              <input
                value={newChoice}
                onChange={e => setNewChoice(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 border rounded text-xs overflow-hidden"
                placeholder="Add option…"
                onKeyDown={e => e.key === "Enter" && handleAddChoice()}
                style={{
                  fontSize: preset.fontSize,
                  minHeight: Math.max(24, preset.rowHeight * 0.7),
                }}
                maxLength={30}
              />
              <button
                onClick={handleAddChoice}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex-shrink-0"
                style={{
                  fontSize: preset.fontSize <= 14 ? 12 : 14,
                  minWidth: 38, // stays smaller on XL font
                  maxWidth: 44,
                }}
              >Add</button>
            </div>
          </div>
        )}
        {/* Advanced (Type) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition w-full"
            style={{ fontSize: "var(--body)" }} // Dynamically scale with font preset
          >
            {showAdvanced ? "▼" : "►"} Advanced Options
          </button>
          {showAdvanced && (
            <div
              className="mt-3 p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-100"
              style={{ fontSize: "var(--body)" }}
            >
              <div className="font-bold mb-1" style={{ fontSize: "var(--h3)" }}>
                ⚠️ Warning: Changing the column type may damage or hide your data.
              </div>
              <div className="mb-3" style={{ fontSize: "var(--small)" }}>
                Changing column type can result in lost or unusable data for existing cells.
                <br />
                Proceed only if you are sure.
              </div>
              <label className="block font-medium mb-1" style={{ fontSize: "var(--small)" }}>
                Column Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ColumnDataType)}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                style={{ fontSize: "var(--body)" }}
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}
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
