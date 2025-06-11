// components/UX/ColorSwatchGrid.tsx
import React from "react";

const COLOR_GROUPS = [
  // Each group: [light, normal, dark]
  ["#f1f5f9", "#64748b", "#334155"], // Gray
  ["#dbeafe", "#3b82f6", "#1e40af"], // Blue
  ["#bbf7d0", "#22c55e", "#15803d"], // Green
  ["#f0fdfa", "#14b8a6", "#0f766e"], // Teal
  ["#cffafe", "#06b6d4", "#0e7490"], // Cyan
  ["#ede9fe", "#8b5cf6", "#5b21b6"], // Purple
  ["#fce7f3", "#ec4899", "#be185d"], // Pink
  ["#fee2e2", "#ef4444", "#b91c1c"], // Red
  ["#ffedd5", "#f59e42", "#ea580c"], // Orange
  ["#fef9c3", "#eab308", "#b45309"], // Yellow
  ["#e0e7ff", "#6366f1", "#312e81"], // Indigo
  ["#f3e8ff", "#a21caf", "#86198f"], // Fuchsia
];

const PRESET_COLORS = COLOR_GROUPS.flat();

interface ColorSwatchGridProps {
  value: string;                  // currently selected color hex (e.g. "#3b82f6")
  onChange: (color: string) => void;  // callback when user selects a color
  swatchSize?: number;            // optional, size of each swatch
}

export default function ColorSwatchGrid({ value, onChange, swatchSize = 24 }: ColorSwatchGridProps) {
  return (
    <div className="flex flex-wrap gap-1.5 p-1 max-w-[220px]">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          className="rounded border border-gray-300 transition-all duration-150"
          style={{
            width: swatchSize,
            height: swatchSize,
            background: color,
            boxShadow: value === color ? "0 0 0 2px #2563eb" : undefined,
            outline: value === color ? "2px solid #2563eb" : undefined,
          }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
      {/* Custom color input */}
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={e => onChange(e.target.value)}
        className="ml-2 border rounded"
        style={{
          width: swatchSize,
          height: swatchSize,
          padding: 0,
        }}
        title="Custom color"
      />
    </div>
  );
}
