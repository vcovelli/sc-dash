"use client";
import React from "react";
import { FONT_SIZE_PRESETS } from "@/components/settings/font/FontSizeDropdown";

interface Props {
  fontSizeIdx: number;
  setFontSizeIdx: (idx: number) => void;
  presets: typeof FONT_SIZE_PRESETS;
}

const FontSizePresetsSection: React.FC<Props> = ({ fontSizeIdx, setFontSizeIdx }) => {
  const preset = FONT_SIZE_PRESETS[fontSizeIdx];

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
        Table Text & Row Size
      </label>
      <div className="flex items-center gap-2 w-full justify-between mt-2">
        {FONT_SIZE_PRESETS.map((preset, idx) => (
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
      <div className="mt-3 text-xs text-gray-500 text-center">
        <b>{preset.label}</b> — {preset.fontSize}px font, {preset.rowHeight}px row
      </div>
    </div>
  );
};

export default FontSizePresetsSection;
