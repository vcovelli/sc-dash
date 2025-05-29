import React, { useMemo, useCallback } from "react";
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
import ChoiceTag from "./Choice/ChoiceTag";
import ReferenceTag from "./Reference/ReferenceTag";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";
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
  const normalizedType = useMemo(() => column.type?.toLowerCase(), [column.type]);

  const handleSave = useCallback(
    (id: string, key: string, newValue: any) => {
      if (newValue === rowId) return;
      if (newValue !== value) onSave(id, key, newValue);
      onEditComplete?.();
    },
    [rowId, value, onSave, onEditComplete]
  );

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

  const wrapperProps = {
    className: "w-full h-full px-2 py-1 text-sm select-none cursor-pointer",
    onDoubleClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStartEdit?.();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onStartEdit?.();
    },
    tabIndex: 0,
  };

  if (normalizedType === "boolean") {
    return (
      <div {...wrapperProps} className="flex justify-center items-center h-full w-full cursor-pointer">
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

  if (normalizedType === "date") {
    return (
      <div {...wrapperProps}>
        {value ? format(new Date(value), "yyyy-MM-dd") : <span className="text-gray-400 dark:text-gray-600">—</span>}
      </div>
    );
  }

  if (["reference", "reference_list"].includes(normalizedType) && column.referenceData) {
    const renderReference = (v: string) => {
      const opt = column.referenceData.find(c => String(c.id) === String(v));
      return <ReferenceTag key={v} value={opt?.name ?? v} />;
    };
    return (
      <div {...wrapperProps} className="flex flex-wrap gap-1">
        {Array.isArray(value) ? value.map(renderReference) : renderReference(value)}
      </div>
    );
  }

  if (["choice", "choice_list"].includes(normalizedType) && column.choices) {
    const renderChoice = (v: string) => {
      const opt = typeof column.choices[0] === "object"
        ? (column.choices as { id: string; name: string }[]).find(c => c.id === v)
        : { name: v };
      return <ChoiceTag key={v} value={opt?.name ?? v} />;
    };
    return (
      <div {...wrapperProps} className="flex flex-wrap gap-1">
        {Array.isArray(value) ? value.map(renderChoice) : renderChoice(value)}
      </div>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    return <div {...wrapperProps}>{value}</div>;
  }

  return (
    <div className="w-full h-full px-2 py-1 text-xs text-gray-400 select-none">
      [Uneditable: {column.type}]
    </div>
  );
}
