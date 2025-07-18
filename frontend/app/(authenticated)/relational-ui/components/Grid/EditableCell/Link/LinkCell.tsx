"use client";

import React from "react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface LinkCellProps {
  value: string;
  rowId: number;
  column: CustomColumnDef<unknown>;
  editing?: boolean;
  onSave?: (id: number, key: string, value: string) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize?: number;
  rowHeight?: number;
}

const LinkCell: React.FC<LinkCellProps> = React.memo(({ value, fontSize = 14, rowHeight = 36 }) => {
  if (!value || typeof value !== "string")
    return (
      <span
        className="text-gray-400 italic text-sm flex items-center"
        style={{ fontSize, minHeight: rowHeight, lineHeight: `${rowHeight}px` }}
      >
        —
      </span>
    );

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline text-sm hover:text-blue-800 flex items-center"
      style={{ fontSize, minHeight: rowHeight, lineHeight: `${rowHeight}px` }}
    >
      {value}
    </a>
  );
});

LinkCell.displayName = "LinkCell";

export default LinkCell;
