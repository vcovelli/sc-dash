"use client";

import React, { useRef, useCallback, useMemo } from "react";
import { PaperclipIcon } from "lucide-react";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface AttachmentCellProps {
  value: string | null;
  rowId: string;
  column: CustomColumnDef<any>;
  editing?: boolean;
  onSave?: (id: string, key: string, value: any) => void;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize?: number;
  rowHeight?: number;
}

const getFilename = (value: string) => {
  if (!value) return "";
  try {
    // If it's a blob URL, just show "Attachment"
    if (value.startsWith("blob:")) return "Attachment";
    // Else, try to extract filename from URL
    const urlParts = value.split("/");
    let filename = urlParts[urlParts.length - 1];
    if (filename.length > 40) filename = filename.slice(0, 18) + "..." + filename.slice(-18);
    return filename;
  } catch {
    return "Attachment";
  }
};

const AttachmentCell: React.FC<AttachmentCellProps> = React.memo(
  ({
    value,
    rowId,
    column,
    editing = false,
    onSave,
    onEditComplete,
    fontSize = 14,
    rowHeight = 36,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onSave) {
          const url = URL.createObjectURL(file); // Temporary blob URL (for local preview)
          onSave(rowId, column.accessorKey, url);
        }
        onEditComplete?.();
      },
      [column.accessorKey, rowId, onSave, onEditComplete]
    );

    // Always show a smart, truncated label
    const displayName = useMemo(() => getFilename(value || ""), [value]);

    // ---- Display Mode ----
    if (!editing) {
      return value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 max-w-full truncate text-blue-600 underline hover:text-blue-800"
          style={{ fontSize, minHeight: rowHeight, height: rowHeight, lineHeight: `${rowHeight}px` }}
          title={displayName}
        >
          <PaperclipIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate block">{displayName}</span>
        </a>
      ) : (
        <span
          className="text-gray-400 italic text-sm"
          style={{ fontSize, minHeight: rowHeight, height: rowHeight, lineHeight: `${rowHeight}px` }}
        >
          No file
        </span>
      );
    }

    // ---- Editing Mode ----
    return (
      <div
        className="relative flex items-center w-full"
        style={{ fontSize, minHeight: rowHeight, height: rowHeight }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-xs py-1"
          style={{ fontSize, height: rowHeight, minHeight: rowHeight }}
        />
      </div>
    );
  }
);

export default AttachmentCell;
