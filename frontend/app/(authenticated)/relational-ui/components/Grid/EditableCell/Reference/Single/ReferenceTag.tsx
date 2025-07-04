import React from "react";

interface ReferenceTagProps {
  value: string | null | undefined;
  className?: string;
  fontSize?: number;
  rowHeight?: number;
  truncate?: boolean;
}

export default function ReferenceTag({
  value,
  className = "",
  fontSize = 14,
  rowHeight = 36,
  truncate = false,
}: ReferenceTagProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded px-2 py-0.5 border border-gray-300 bg-transparent text-gray-800 dark:text-gray-100 ${truncate ? "truncate" : ""} ${className}`}
      style={{
        fontSize,
        minHeight: rowHeight - 6,
        lineHeight: `${rowHeight - 6}px`,
        maxWidth: "100%",
        background: "transparent",
      }}
      title={value ?? ""}
    >
      {value ?? "—"}
    </span>
  );
}
