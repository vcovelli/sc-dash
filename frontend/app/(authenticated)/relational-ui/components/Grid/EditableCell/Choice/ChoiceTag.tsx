import React from "react";

interface Props {
  value: string | null | undefined;
  color?: string; // Accepts HEX, rgb, or Tailwind classes
  className?: string;
  fontSize?: number;
  rowHeight?: number;
  truncate?: boolean;
}

// Helper for padding based on row height
function getPaddingClasses(rowHeight?: number) {
  if (!rowHeight || rowHeight <= 18) return "px-2 py-[1px]";     // XS
  if (rowHeight <= 20) return "px-2 py-0.5";                     // Small
  if (rowHeight <= 24) return "px-2.5 py-[2px]";                 // Default
  if (rowHeight <= 28) return "px-3 py-1";                       // Large
  return "px-3.5 py-1";                                          // XL+
}

// Helper: check if color is HEX/rgb or class
function isHexOrRgb(str?: string) {
  return !!str && (str.startsWith("#") || str.startsWith("rgb"));
}

// Contrast-aware text: black for light, white for dark backgrounds
function getContrastColor(bg: string | undefined) {
  if (!bg || !isHexOrRgb(bg)) return "#111"; // default black
  // Support #rgb, #rrggbb, rgb(x,x,x)
  let r=255,g=255,b=255;
  if (bg.startsWith("#")) {
    if (bg.length === 7) {
      r = parseInt(bg.slice(1,3),16);
      g = parseInt(bg.slice(3,5),16);
      b = parseInt(bg.slice(5,7),16);
    } else if (bg.length === 4) {
      r = parseInt(bg[1]+bg[1],16);
      g = parseInt(bg[2]+bg[2],16);
      b = parseInt(bg[3]+bg[3],16);
    }
  } else if (bg.startsWith("rgb")) {
    const parts = bg.replace(/[^\d,]/g, "").split(",");
    r = parseInt(parts[0]) || 0;
    g = parseInt(parts[1]) || 0;
    b = parseInt(parts[2]) || 0;
  }
  // Luminance formula
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.56 ? "#111" : "#fff"; // 0.56 threshold feels balanced
}

const knownColors: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800 border-green-300",
  "In Transit": "bg-yellow-100 text-yellow-800 border-yellow-300",
  Pending: "bg-red-100 text-red-800 border-red-300",
};

const fallback = "bg-gray-100 text-gray-800 border-gray-300";

const colorPalette = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-pink-100 text-pink-800 border-pink-300",
];

const ChoiceTag: React.FC<Props> = React.memo(function ChoiceTag({
  value,
  color,
  className = "",
  fontSize = 13,
  rowHeight = 24,
  truncate = false,
}) {
  const paddingClass = getPaddingClasses(rowHeight);

  // Handle empty value
  if (!value || typeof value !== "string" || value.trim() === "") {
    return (
      <span
        className={`inline-flex items-center font-medium rounded border 
          ${paddingClass} ${fallback} ${className}`}
        style={{
          fontSize,
          height: rowHeight - 4,
          lineHeight: `${rowHeight - 2}px`,
          maxWidth: "100%",
          color: "#a1a1aa",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          direction: "ltr",
          textAlign: "left",
        }}
        title={typeof value === "string" ? value : undefined}
      >
        –
      </span>
    );
  }

  // Color and style logic
  const tagStyle: React.CSSProperties = {
    fontSize,
    height: rowHeight - 4,
    lineHeight: `${rowHeight - 2}px`,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    direction: "ltr",
    textAlign: "left",
  };
  let colorClass = "";

  if (color && isHexOrRgb(color)) {
    tagStyle.backgroundColor = color;
    tagStyle.borderColor = color;
    tagStyle.color = getContrastColor(color); // contrast-aware
  } else if (color) {
    colorClass = color;
  } else {
    // Fallback to known/tag
    const getColorClass = (val: string): string => {
      if (knownColors[val]) return knownColors[val];
      const hash = [...val].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colorPalette[hash % colorPalette.length];
    };
    colorClass = getColorClass(value);
  }

  // Always force text-black if using Tailwind color classes (so it's readable everywhere)
  if (!isHexOrRgb(color)) {
    tagStyle.color = "#111";
  }

  const tagClass = [
    "inline-flex items-center font-medium rounded border",
    paddingClass,
    colorClass,
    className,
    truncate ? "truncate whitespace-nowrap overflow-hidden" : "",
  ].join(" ");

  return (
    <span
      className={tagClass}
      style={tagStyle}
      title={typeof value === "string" ? value : undefined}
    >
      {value}
    </span>
  );
});
export default ChoiceTag;
