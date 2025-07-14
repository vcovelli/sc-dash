import React from "react";

// Preset definitions
const FONT_SIZE_PRESETS = [
  { value: "xs", label: "XS", fontSize: 12, rowHeight: 18 },
  { value: "sm", label: "Small", fontSize: 14, rowHeight: 20 },
  { value: "base", label: "Default", fontSize: 16, rowHeight: 24 },
  { value: "lg", label: "Large", fontSize: 18, rowHeight: 28 },
  { value: "xl", label: "XL", fontSize: 20, rowHeight: 34 },
];

interface FontSizeSliderProps {
  value: number; // Index in FONT_SIZE_PRESETS
  onChange: (idx: number) => void;
}

const FontSizeSlider: React.FC<FontSizeSliderProps> = ({ value, onChange }) => {
  return (
    <div className="w-full py-2">
      <label className="block font-semibold mb-2">Text & Row Size</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14">{FONT_SIZE_PRESETS[0].label}</span>
        <input
          type="range"
          min={0}
          max={FONT_SIZE_PRESETS.length - 1}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <span className="text-xs text-gray-400 w-14 text-right">{FONT_SIZE_PRESETS[FONT_SIZE_PRESETS.length - 1].label}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        <b>{FONT_SIZE_PRESETS[value].label}</b>: {FONT_SIZE_PRESETS[value].fontSize}px font, {FONT_SIZE_PRESETS[value].rowHeight}px row
      </div>
    </div>
  );
};

export { FONT_SIZE_PRESETS };
export default FontSizeSlider;