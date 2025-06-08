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
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { format } from "date-fns";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";

function TruncatedCell({
  value,
  fontSize,
  rowHeight,
  className = "",
  title,
}: {
  value: React.ReactNode;
  fontSize?: number;
  rowHeight?: number;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={`truncate whitespace-nowrap overflow-hidden w-full px-2 ${className}`}
      style={{
        fontSize,
        minHeight: rowHeight,
        lineHeight: `${rowHeight ? rowHeight - 2 : 20}px`,
      }}
      title={typeof value === "string" ? value : title}
    >
      {value}
    </div>
  );
}

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

  // LOG: Every render
  console.log('[EditableCell]', {
    value,
    rowId,
    accessorKey: column.accessorKey,
    type: column.type,
    editing,
  });

  const normalizedType = useMemo(() => column.type?.toLowerCase(), [column.type]);
  const { fontSize, rowHeight } = useTableSettings();

  const handleSave = useCallback(
    (id: string, key: string, newValue: any) => {
      if (newValue === rowId) return;
      if (newValue !== value) onSave(id, key, newValue);
      onEditComplete?.();
    },
    [rowId, value, onSave, onEditComplete]
  );

  if (normalizedType === "boolean") {
    return (
      <BooleanCell
        value={!!value}
        rowId={rowId}
        column={column}
        onSave={handleSave}
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
        editing={editing}
        onEditComplete={onEditComplete}
        fontSize={fontSize}
        rowHeight={rowHeight}
      />
    );
  }

  if (editing) {
    if (["reference", "reference_list"].includes(normalizedType) && column.referenceData) {
      return (
        <ReferenceCell
          value={value}
          row={row}
          rowId={rowId}
          column={column as any}
          onSave={handleSave}
          editing
          onEditComplete={onEditComplete}
          onStartEdit={onStartEdit}
          fontSize={fontSize}
          rowHeight={rowHeight}
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
          fontSize={fontSize}
          rowHeight={rowHeight}
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
          fontSize={fontSize}
          rowHeight={rowHeight}
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
          fontSize={fontSize}
          rowHeight={rowHeight}
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
          fontSize={fontSize}
          rowHeight={rowHeight}
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
          fontSize={fontSize}
          rowHeight={rowHeight}
        />
      );
    }
    if (normalizedType === "date") {
      console.log("[EditableCell] Render DateCell: editing?", editing, { value, rowId, col: column.accessorKey });
      return (
        <DateCell
          value={value}
          rowId={rowId}
          column={column}
          onSave={handleSave}
          editing={editing}
          onEditComplete={onEditComplete}
          onStartEdit={onStartEdit}
          fontSize={fontSize}
          rowHeight={rowHeight}
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
        fontSize={fontSize}
        rowHeight={rowHeight}
      />
    );
  }

  // Non-editing cell wrapper
  const wrapperProps = {
    className: "w-full flex items-center px-2 select-none cursor-pointer",
    onDoubleClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStartEdit?.();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onStartEdit?.();
    },
    tabIndex: 0,
    style: { fontSize, minHeight: rowHeight },
  };

  if (normalizedType === "boolean") {
    return (
      <div
        {...wrapperProps}
        className="flex justify-center items-center h-full w-full cursor-pointer"
        style={{ ...wrapperProps.style }}
      >
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
      <div
        {...wrapperProps}
        className={`w-full flex items-center px-2 select-none cursor-pointer whitespace-nowrap overflow-hidden`}
        style={{ ...wrapperProps.style }}
      >
        <span className="truncate w-full block" style={{ lineHeight: `${rowHeight}px` }}>
          {value
            ? format(new Date(value), "MM-dd-yyyy")
            : <span className="text-gray-400 dark:text-gray-600">—</span>}
        </span>
      </div>
    );
  }

  if (["reference", "reference_list"].includes(normalizedType) && column.referenceData) {
    const renderReference = (v: string) => {
      const opt = column.referenceData.find(c => String(c.id) === String(v));
      return <ReferenceTag key={v} value={opt?.name ?? v} fontSize={fontSize} rowHeight={rowHeight} truncate />;
    };
    const isMulti = Array.isArray(value);
    return (
      <div
        {...wrapperProps}
        className={
          isMulti
            ? "flex items-center flex-wrap gap-1 h-full w-full justify-start"
            : "flex items-center h-full w-full justify-center"
        }
        style={{ ...wrapperProps.style, minHeight: rowHeight }}
      >
        {isMulti ? value.map(renderReference) : renderReference(value)}
      </div>
    );
  }

  // --- Choice display ---
  if (["choice", "choice_list"].includes(normalizedType) && column.choices) {
    const renderChoice = (v: string) => {
      const opt = typeof column.choices[0] === "object"
        ? (column.choices as { id: string; name: string; color?: string }[]).find(c => c.id === v)
        : { name: v };
      return <ChoiceTag key={v} value={opt?.name ?? v} color={opt?.color} fontSize={fontSize} rowHeight={rowHeight} truncate />;
    };
    const isMulti = Array.isArray(value);
    return (
      <div
        {...wrapperProps}
        className={
          isMulti
            ? "flex items-center flex-wrap gap-1 h-full w-full min-w-0 justify-start"
            : "flex items-center h-full w-full min-w-0 justify-center"
        }
        style={{ ...wrapperProps.style, minHeight: rowHeight }}
      >
        {isMulti ? value.map(renderChoice) : renderChoice(value)}
      </div>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    return (
      <TruncatedCell
        value={value}
        fontSize={fontSize}
        rowHeight={rowHeight}
        title={String(value)}
      />
    );
  }

  return (
    <TruncatedCell
      value={`[Uneditable: ${column.type}]`}
      fontSize={fontSize}
      rowHeight={rowHeight}
      className="text-xs text-gray-400 select-none"
      title={column.type}
    />
  );
}
