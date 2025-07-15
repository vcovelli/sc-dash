import React from "react";

// Font size presets
export const FONT_SIZE_PRESETS = [
  { value: "xs", label: "XS", fontSize: 12, rowHeight: 18 },
  { value: "sm", label: "Small", fontSize: 14, rowHeight: 20 },
  { value: "base", label: "Default", fontSize: 16, rowHeight: 24 },
  { value: "lg", label: "Large", fontSize: 18, rowHeight: 28 },
  { value: "xl", label: "XL", fontSize: 20, rowHeight: 34 },
];

interface FontSizeDropdownProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export const FONT_SIZE_PRESETS_MAP: Record<string, number> = Object.fromEntries(
  FONT_SIZE_PRESETS.map(p => [p.value, p.fontSize])
);

export default function FontSizeDropdown({ value, onChange }: FontSizeDropdownProps) {
  const currentPreset = FONT_SIZE_PRESETS.find(f => f.value === value);
  
  return (
    <div>
      <div className="relative">
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 shadow focus:ring-2 focus:ring-blue-400 transition"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ 
            fontSize: "var(--body)",
            padding: `calc(var(--body) * 0.75) calc(var(--body) * 1.0)`
          }}
        >
          {FONT_SIZE_PRESETS.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              style={{
                fontSize: Math.min(opt.fontSize, 16), // Cap option font size for readability
                fontWeight: value === opt.value ? "bold" : "normal"
              }}
            >
              {opt.label} ({opt.fontSize}px)
            </option>
          ))}
        </select>
      </div>
    <div className="relative">
      <select
        className="
          w-full rounded-lg border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
          py-2.5 px-3 text-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          transition-colors duration-200
          appearance-none cursor-pointer
          hover:border-gray-400 dark:hover:border-gray-500
        "
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {FONT_SIZE_PRESETS.map(opt => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label} ({opt.fontSize}px)
          </option>
        ))}
      </select>
    </div>
  );
}
