"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import classNames from "classnames";
import ReferenceTag from "./ReferenceTag";

interface ReferenceOption {
  id: string;
  name: string;
}

interface ReferenceListProps {
  value: string;
  options: ReferenceOption[];
  onChange: (value: string) => void;
  onEditComplete?: () => void;
  getColor?: (name: string) => string;
  autoFocus?: boolean;
  fontSize?: number;
  rowHeight?: number;
}

// --- Sizing logic: match ChoiceList ---
const getPaddingForSize = (fontSize: number) => {
  if (fontSize <= 12) return { py: "py-[6px]", minH: 24, lh: 1.5 };
  if (fontSize === 13) return { py: "py-[7px]", minH: 28, lh: 1.5 };
  if (fontSize === 14) return { py: "py-[8px]", minH: 32, lh: 1.5 };
  if (fontSize === 16) return { py: "py-[9px]", minH: 36, lh: 1.5 };
  return { py: "py-[10px]", minH: 40, lh: 1.5 };
};

const ReferenceList: React.FC<ReferenceListProps> = React.memo(
  ({
    value,
    options,
    onChange,
    onEditComplete,
    getColor = () => "bg-indigo-100 text-indigo-800 border border-indigo-300",
    autoFocus = false,
    fontSize = 14,
    rowHeight = 36,
  }) => {
    const [open, setOpen] = useState(false);
    const completedRef = useRef(false);

    // Find label for value
    const getLabel = useCallback(
      (val: string) =>
        options.find((opt) => String(opt.id) === String(val))?.name ?? "—",
      [options]
    );

    // Sizing logic
    const { py, minH, lh } = getPaddingForSize(fontSize);

    const safeComplete = useCallback(() => {
      if (!completedRef.current && onEditComplete) {
        completedRef.current = true;
        requestAnimationFrame(() => onEditComplete());
      }
    }, [onEditComplete]);

    useEffect(() => {
      completedRef.current = false;
      if (autoFocus) {
        requestAnimationFrame(() => setOpen(true));
      }
    }, [autoFocus]);

    const handleValueChange = useCallback(
      (val: string) => {
        onChange(val);
        setOpen(false);
        safeComplete();
      },
      [onChange, safeComplete]
    );

    const handleOpenChange = useCallback(
      (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          safeComplete();
        }
      },
      [safeComplete]
    );

    return (
      <Select.Root
        open={open}
        onOpenChange={handleOpenChange}
        value={value}
        onValueChange={handleValueChange}
      >
        <Select.Trigger
          className="flex items-center w-full min-w-0 bg-transparent focus:outline-none"
          style={{
            border: "none",
            boxShadow: "none",
            fontSize,
            height: rowHeight,
            lineHeight: `${rowHeight}px`,
            paddingLeft: 4,
            paddingRight: 2,
            minHeight: rowHeight,
            minWidth: 0,
          }}
        >
          <span
            className={classNames(
              "inline-flex items-center px-2 py-0 font-medium border rounded truncate",
              value
                ? getColor(getLabel(value))
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            )}
            style={{
              maxWidth: "100%",
              fontWeight: 500,
              fontSize,
              height: rowHeight - 6,
              minHeight: rowHeight - 6,
              lineHeight: `${rowHeight}px`,
            }}
          >
            <ReferenceTag
              value={getLabel(value)}
              fontSize={fontSize}
              rowHeight={rowHeight}
              truncate
            />
          </span>
          <Select.Icon className="ml-1 w-4 h-4 opacity-70">
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            avoidCollisions
            position="popper"
            sideOffset={2}
            className="bg-white dark:bg-neutral-900 rounded shadow-lg border border-gray-200 dark:border-neutral-700 z-50 min-w-[160px] overflow-y-auto max-h-72"
            style={{
              fontSize,
              padding: "4px 0",
            }}
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.id}
                  value={opt.id}
                  className={classNames(
                    `px-2 ${py} mb-1 last:mb-0 hover:bg-indigo-50 dark:hover:bg-neutral-800 focus:bg-indigo-100 dark:focus:bg-neutral-800 cursor-pointer rounded flex items-center gap-2 outline-none`,
                    value === opt.id && "ring-2 ring-indigo-400"
                  )}
                  style={{
                    fontSize,
                    minHeight: minH,
                    lineHeight: lh,
                    transition: "background 0.15s",
                  }}
                >
                  <Select.ItemText>
                    <ReferenceTag
                      value={opt.name}
                      fontSize={fontSize}
                      rowHeight={rowHeight}
                      truncate
                    />
                  </Select.ItemText>
                  {value === opt.id && (
                    <CheckIcon className="ml-2 w-4 h-4 text-indigo-500" />
                  )}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    );
  }
);

ReferenceList.displayName = "ReferenceList";

export default ReferenceList;
