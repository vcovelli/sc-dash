import React, { useMemo, useCallback, JSX } from "react";
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
import { format, isValid } from "date-fns";
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

function getFormattedDate(value: unknown): string | JSX.Element {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof Date
  ) {
    const date = new Date(value);
    if (isValid(date)) {
      return format(date, "MM-dd-yyyy");
    }
  }
  return <span className="text-gray-400 dark:text-gray-600">—</span>;
}

export default function EditableCell({
  value,
  rowId,
  column,
  onSave,
  editing,
  onEditComplete,
  onStartEdit,
}: {
  value: unknown;
  row: Record<string, unknown>;
  rowId: string;
  column: CustomColumnDef<unknown>;
  onSave: (rowId: string, key: string, value: unknown) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}) {
  const normalizedType = useMemo(() => column.type?.toLowerCase(), [column.type]);
  const { fontSize, rowHeight } = useTableSettings();

  const handleSave = useCallback(
    (id: string, key: string, newValue: unknown) => {
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
        value={typeof value === "number" ? value : null}
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
          value={typeof value === "string" || typeof value === "number" ? value : null}
          rowId={rowId}
          column={column as CustomColumnDef<unknown>}
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
          value={Array.isArray(value) ? (value[0] ?? "") : (value ?? "")}
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
          value={typeof value === "number" ? value : null}
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
          value={typeof value === "string" ? value : ""}
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
          value={typeof value === "string" || typeof value === "number" || value == null ? value ?? "" : String(value)}
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
          value={typeof value === "string" ? value : ""}
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
      return (
        <DateCell
          value={typeof value === "string" || typeof value === "number" || value instanceof Date ? value : undefined}
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
        value={typeof value === "string" || typeof value === "number" ? value : ""}
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

  if (normalizedType === "date") {
    return (
      <div
        {...wrapperProps}
        className="w-full flex items-center px-2 select-none cursor-pointer whitespace-nowrap overflow-hidden"
        style={{ ...wrapperProps.style }}
      >
        <span className="truncate w-full block" style={{ lineHeight: `${rowHeight}px` }}>
          {getFormattedDate(value)}
        </span>
      </div>
    );
  }

  if (["reference", "reference_list"].includes(normalizedType) && Array.isArray(column.referenceData)) {
    const renderReference = (v: string) => {
      const opt = column.referenceData!.find((c) => String(c.id) === String(v));
      return (
        <ReferenceTag
          key={v}
          value={opt?.name ?? v}
          fontSize={fontSize}
          rowHeight={rowHeight}
          truncate
        />
      );
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
        {isMulti
          ? (value as string[]).map(renderReference)
          : renderReference(typeof value === "string" ? value : "")}
      </div>
    );
  }

  if (["choice", "choice_list"].includes(normalizedType) && Array.isArray(column.choices)) {
    const choicesArr = column.choices as
      | { id: string; name: string; color?: string }[]
      | string[];

    const renderChoice = (v: string) => {
      const opt =
        typeof choicesArr[0] === "object"
          ? (choicesArr as { id: string; name: string; color?: string }[]).find((c) => c.id === v)
          : { name: v };
      return (
        <ChoiceTag
          key={v}
          value={opt?.name ?? v}
          color={typeof opt === "object" && "color" in opt ? opt.color : undefined}
          fontSize={fontSize}
          rowHeight={rowHeight}
          truncate
        />
      );
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
        {isMulti
          ? (value as string[]).map(renderChoice)
          : renderChoice(typeof value === "string" ? value : "")}
      </div>
    );
  }

  const val = value == null || value === "" ? "" : String(value);

  return (
    <TruncatedCell
      value={val || <span className="text-gray-400 dark:text-gray-600">—</span>}
      fontSize={fontSize}
      rowHeight={rowHeight}
      title={val || ""}
    />
  );
}
