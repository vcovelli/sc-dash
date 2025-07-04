import React, { useRef, useState } from "react";
import { nanoid } from "nanoid";
import ColorSwatchGrid from "./ColorSwatchGrid";

const CHOICE_COLOR_PALETTE = [
  "#2563eb", "#22c55e", "#eab308", "#ef4444", "#db2777", "#6366f1", "#06b6d4", "#f59e42",
  "#334155", "#d4d4d8", "#fde047", "#fca5a5", "#a21caf", "#c026d3", "#b91c1c", "#64748b",
];

export default function ChoiceOptionsEditor({
  choices,
  setChoices,
}: {
  choices: { id: string; name: string; color?: string }[];
  setChoices: (updater: (arr: any[]) => any[]) => void;
}) {
  const [newChoice, setNewChoice] = useState("");
  const [editingChoiceIdx, setEditingChoiceIdx] = useState<number | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Choice Options</label>
      <div className="space-y-2">
        {choices.map((opt, idx) => (
          <div
            key={opt.id}
            className="relative flex items-center gap-3 py-1 px-2 rounded group bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          >
            <button
              type="button"
              title="Change color"
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
              style={{ background: opt.color || "#ddd", borderColor: opt.color || "#bbb" }}
              onClick={() => setEditingChoiceIdx(editingChoiceIdx === idx ? null : idx)}
              tabIndex={0}
            />
            {editingChoiceIdx === idx && (
              <div
                ref={colorPickerRef}
                className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded p-2"
                style={{ minWidth: 144 }}
              >
                <ColorSwatchGrid
                  value={opt.color || "#2563eb"}
                  onChange={color => handleChangeChoiceColor(idx, color)}
                  swatchSize={24}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={opt.color || "#2563eb"}
                    onChange={e => handleChangeChoiceColor(idx, e.target.value)}
                    className="w-7 h-7 border rounded cursor-pointer"
                    title="Custom color"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={opt.color || ""}
                    onChange={e => handleChangeChoiceColor(idx, e.target.value)}
                    placeholder="#hex"
                    className="w-16 px-1 py-0.5 border rounded text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
            )}
            <input
              value={opt.name}
              onChange={e => handleChangeChoiceName(idx, e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border rounded text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
              maxLength={30}
            />
            <button
              type="button"
              onClick={() => handleRemoveChoice(idx)}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              title="Remove choice"
            >
              ×
            </button>
          </div>
        ))}
        {/* Add Option Row */}
        <div className="flex items-center gap-2 mt-3 px-2">
          <input
            value={newChoice}
            onChange={e => setNewChoice(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 border rounded text-xs overflow-hidden"
            placeholder="Add option…"
            onKeyDown={e => e.key === "Enter" && handleAddChoice()}
            maxLength={30}
          />
          <button
            onClick={handleAddChoice}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex-shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
