"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Popover } from "@headlessui/react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { CalendarIcon } from "@radix-ui/react-icons";

interface DateCellProps {
  value: string | null;
  rowId: string;
  column: { accessorKey: string };
  onSave: (rowId: string, key: string, value: string | null) => void;
  editing?: boolean;
  onEditComplete?: () => void;
  onStartEdit?: () => void;
}

const DateCell: React.FC<DateCellProps> = React.memo(
  ({ value, rowId, column, onSave, editing = false, onEditComplete }) => {
    const [selected, setSelected] = useState<Date | undefined>(
      value ? new Date(value) : undefined
    );

    const inputRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      if (editing) {
        inputRef.current?.focus();
      }
    }, [editing]);

    const handleSelect = useCallback(
      (date: Date | undefined) => {
        setSelected(date);
        if (date) {
          onSave(rowId, column.accessorKey, date.toISOString());
        } else {
          onSave(rowId, column.accessorKey, null);
        }
        onEditComplete?.();
      },
      [rowId, column.accessorKey, onSave, onEditComplete]
    );

    const formatDate = useCallback((date: Date) => {
      return new Intl.DateTimeFormat("en-CA").format(date);
    }, []);

    return (
      <div className="relative text-sm">
        {editing ? (
          <Popover as="div" className="relative z-30">
            {({ open, close }) => (
              <>
                <Popover.Button
                  ref={inputRef}
                  autoFocus
                  tabIndex={0}
                  data-autofocus-select
                  className="flex items-center gap-1 border px-2 py-1 rounded shadow-sm hover:shadow focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-black"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>{selected ? formatDate(selected) : "Select date"}</span>
                </Popover.Button>

                <Popover.Panel className="absolute mt-2 bg-white rounded shadow border z-50 datepicker-modal-active">
                  <DayPicker
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                      handleSelect(date);
                      close();
                    }}
                  />
                </Popover.Panel>
              </>
            )}
          </Popover>
        ) : (
          <span className="text-gray-700">
            {value ? formatDate(new Date(value)) : <span className="text-gray-400">—</span>}
          </span>
        )}
      </div>
    );
  }
);

export default DateCell;
