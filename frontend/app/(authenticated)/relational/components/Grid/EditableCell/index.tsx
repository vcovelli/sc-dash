import React from "react";
import TextCell from "./Text/TextCell";
import ChoiceCell from "./Choice/ChoiceCell";
import DateCell from "./Date/DateCell";
import ReferenceCell from "./Reference/ReferenceCell";
import BooleanCell from "./Boolean/BooleanCell";
import CurrencyCell from "./Currency/CurrencyCell";
import NumberCell from "./Number/NumberCell";
import LinkCell from "./Link/LinkCell";
import FormulaCell from "./Formula/FormulaCell";
import AttachmentCell from "./Attachment/AttachmentCell";
import { CustomColumnDef } from "@relational/lib/types";
import { format } from "date-fns";

export default function EditableCell({
  value,
  row,
  rowId,
  column,
  onSave,
  editing,
  onEditComplete,
  onStartEdit,
}: {
  value: any;
  row: any;
  rowId: string;
  column: CustomColumnDef<any>;
  onSave: (rowId: string, key: string, value: any) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}) {
  const handleSave = (id: string, key: string, newValue: any) => {
    if (newValue === rowId) return;
    if (newValue !== value) onSave(id, key, newValue);
    onEditComplete?.();
  };

  const normalizedType = column.type?.toLowerCase();

  // ---- EDIT MODE ----
  if (editing) {
    if (["reference", "reference_list"].includes(normalizedType) && column.referenceData) {
      return (
        <ReferenceCell
          value={value}
          row={row}
          rowId={rowId}
          column={column as CustomColumnDef<any> & { referenceData: { id: string; name: string }[] }}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
          onStartEdit={onStartEdit}
        />
      );
    }
    if (["choice", "choice_list"].includes(normalizedType) && column.choices) {
      return (
        <ChoiceCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
          onStartEdit={onStartEdit}
        />
      );
    }
    if (normalizedType === "boolean") {
      return (
        <BooleanCell
          value={!!value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "currency") {
      return (
        <CurrencyCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "number") {
      return (
        <NumberCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "link") {
      return (
        <LinkCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "formula") {
      return (
        <FormulaCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "attachment") {
      return (
        <AttachmentCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
        />
      );
    }
    if (normalizedType === "date") {
      return (
        <DateCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing={editing}
          onEditComplete={onEditComplete}
        />
      );
    }
    // fallback for unknown types (editable)
    return (
      <TextCell
        value={value}
        row={row}
        rowId={rowId}
        column={column}
        onSave={handleSave}
        editing
        onEditComplete={onEditComplete}
        onStartEdit={onStartEdit}
      />
    );
  }

  // ---- READ MODE ----

  // Boolean: read-only checkbox
  if (normalizedType === "boolean") {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <input
          type="checkbox"
          checked={!!value}
          readOnly
          tabIndex={-1}
          className="w-4 h-4 cursor-not-allowed opacity-60"
        />
      </div>
    );
  }

  // Date: formatted text (yyyy-MM-dd)
  if (normalizedType === "date") {
    return (
      <span className="text-gray-700">
        {value ? format(new Date(value), "yyyy-MM-dd") : <span className="text-gray-400">—</span>}
      </span>
    );
  }

  // Reference/Reference List: show name(s) instead of id(s)
  if (
    (normalizedType === "reference" || normalizedType === "reference_list") &&
    column.referenceData
  ) {
    if (Array.isArray(value)) {
      // Reference List: map each id to name, join with commas (swap to tags if you want)
      const names = value
        .map((v: any) => {
          const found = column.referenceData.find((c: any) => String(c.id) === String(v));
          return found ? found.name : null;
        })
        .filter(Boolean)
        .join(", ");
      return <span>{names || <span className="text-gray-400">—</span>}</span>;
    } else {
      // Single Reference
      const refObj = column.referenceData.find((c: any) => String(c.id) === String(value));
      return <span>{refObj ? refObj.name : <span className="text-gray-400">—</span>}</span>;
    }
  }

  // Choice/Choice List: show display name(s) instead of raw value(s)
  if (
    (normalizedType === "choice" || normalizedType === "choice_list") &&
    column.choices
  ) {
    if (Array.isArray(value)) {
      // Choice List: map each id to name, join with commas
      let displayNames = value
        .map((v: any) => {
          if (Array.isArray(column.choices) && typeof column.choices[0] === "object") {
            const found = column.choices.find((c: any) => (c.id ?? c) === v);
            return found?.name ?? v;
          }
          return v;
        })
        .filter(Boolean)
        .join(", ");
      return <span>{displayNames || <span className="text-gray-400">—</span>}</span>;
    } else {
      // Single Choice
      let displayName = value;
      if (Array.isArray(column.choices) && typeof column.choices[0] === "object") {
        const found = column.choices.find((c: any) => (c.id ?? c) === value);
        displayName = found?.name ?? value;
      }
      return <span>{displayName || <span className="text-gray-400">—</span>}</span>;
    }
  }

  // fallback for strings and numbers (show as plain text)
  if (typeof value === "string" || typeof value === "number") {
    return (
      <div
        className="w-full h-full px-2 py-1 text-sm select-none cursor-pointer"
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStartEdit?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onStartEdit?.();
        }}
        tabIndex={0}
      >
        {value}
      </div>
    );
  }

  // fallback for truly unhandled types
  return (
    <div className="w-full h-full px-2 py-1 text-xs text-gray-400 select-none">
      [Uneditable: {column.type}]
    </div>
  );
}
