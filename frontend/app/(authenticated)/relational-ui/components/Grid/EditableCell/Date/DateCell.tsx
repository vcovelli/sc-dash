import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

export type DateCellProps = {
  value: string | number | Date | undefined;
  rowId: number;
  column: CustomColumnDef<unknown>;
  onSave: (rowId: number, key: string, value: unknown) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
  fontSize?: number;
  rowHeight?: number;
};

function focusCalendarGrid(portalRef: React.RefObject<HTMLDivElement | null>) {
  const grid = portalRef.current?.querySelector('[role="grid"]') as HTMLDivElement | null;
  if (grid) {
    grid.tabIndex = -1;
    grid.focus();
  }
}

const DateCell = React.memo(function DateCell({
  value,
  rowId,
  column,
  onSave,
  editing = false,
  onEditComplete,
  onStartEdit,
  fontSize = 14,
  rowHeight = 36,
}: DateCellProps) {
  const [selected, setSelected] = useState<Date | undefined>(value ? new Date(value) : undefined);
  const [originalValue, setOriginalValue] = useState(value);
  const [anchorPos, setAnchorPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) {
      setOriginalValue(value);
      setSelected(value ? new Date(value) : undefined);
      setTimeout(() => {
        if (portalRef.current) focusCalendarGrid(portalRef);
      }, 1);
    }
  }, [editing, value]);

  const updateAnchor = useCallback(() => {
    if (editing && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const pickerHeight = 370;
      const pickerWidth = 320;
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY + 4;
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      if (left + pickerWidth > winWidth - 8) left = winWidth - pickerWidth - 8;
      if (top + pickerHeight > winHeight - 8) top = rect.top + window.scrollY - pickerHeight - 8;
      if (top < 8) top = 8;
      setAnchorPos({
        top,
        left,
        width: rect.width,
      });
    }
  }, [editing]);

  useLayoutEffect(() => {
    if (editing) {
      updateAnchor();
    }
  }, [editing, updateAnchor]);

  useEffect(() => {
    if (!editing) return;
    const blockScroll = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", " "].includes(e.key)
      ) {
        if (
          portalRef.current?.contains(document.activeElement) ||
          (document.activeElement === document.body && portalRef.current)
        ) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", blockScroll, { capture: true });
    return () => window.removeEventListener("keydown", blockScroll, { capture: true });
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (
        portalRef.current &&
        !portalRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setSelected(originalValue ? new Date(originalValue as string) : undefined);
        onEditComplete?.();
      }
    }
    window.addEventListener("mousedown", handleClick, true);
    return () => window.removeEventListener("mousedown", handleClick, true);
  }, [editing, originalValue, onEditComplete]);

  const handlePortalKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "Enter") {
      if (selected) {
        onSave(rowId, column.accessorKey, selected.toISOString());
      } else if (originalValue) {
        onSave(rowId, column.accessorKey, originalValue);
      }
      onEditComplete?.();
    }
    if (e.key === "Escape") {
      setSelected(originalValue ? new Date(originalValue as string) : undefined);
      onEditComplete?.();
    }
  };

  const formatDate = (date: Date) => format(date, "MM-dd-yyyy");

  const portal = editing && typeof window !== "undefined"
    ? createPortal(
        <div
          ref={portalRef}
          className="z-[99999] fixed datepicker-modal-active"
          tabIndex={-1}
          style={{
            top: anchorPos.top,
            left: anchorPos.left,
            minWidth: Math.max(272, anchorPos.width),
            pointerEvents: "auto",
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border p-2 z-[99999] min-w-[272px] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
            tabIndex={0}
            onKeyDown={handlePortalKeyDown}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={date => setSelected(date)}
              initialFocus
            />
            <div className="flex gap-2 mt-2 w-full justify-end">
              <button
                onClick={() => {
                  setSelected(originalValue ? new Date(originalValue as string) : undefined);
                  onEditComplete?.();
                }}
                className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selected) {
                    onSave(rowId, column.accessorKey, selected.toISOString());
                  } else if (originalValue) {
                    onSave(rowId, column.accessorKey, originalValue);
                  }
                  onEditComplete?.();
                }}
                className="text-xs px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {editing && portal}
      <button
        ref={btnRef}
        tabIndex={0}
        autoFocus={editing}
        className="flex items-center gap-1 border px-2 py-1 rounded w-full truncate bg-white dark:bg-gray-900"
        style={{ fontSize, minHeight: rowHeight, height: rowHeight, lineHeight: `${rowHeight}px` }}
        onClick={editing ? e => e.stopPropagation() : () => onStartEdit?.()}
        onKeyDown={e => {
          if (!editing && (e.key === "Enter" || e.key === " ")) onStartEdit?.();
        }}
        title={selected ? formatDate(selected) : "Select date"}
        aria-label="Edit date"
        type="button"
      >
        <CalendarIcon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{selected ? formatDate(selected) : "—"}</span>
      </button>
    </>
  );
});

export default DateCell;
