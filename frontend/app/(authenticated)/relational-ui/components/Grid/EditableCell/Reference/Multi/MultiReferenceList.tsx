// MultiReferenceList.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import classNames from "classnames";
import MultiReferenceTag from "./MultiReferenceTag";

interface ReferenceOption {
  id: string;
  name: string;
}

interface MultiReferenceListProps {
  value: string[];
  options: ReferenceOption[];
  onChange: (value: string[]) => void;
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

const MultiReferenceList: React.FC<MultiReferenceListProps> = React.memo(
  ({
    value = [],
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
      (id: string) => {
        let next: string[];
        if (value.includes(id)) {
          next = value.filter((v) => v !== id);
        } else {
          next = [...value, id];
        }
        onChange(next);
      },
      [value, onChange]
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

    // Remove a tag directly
    const handleRemoveTag = useCallback(
      (id: string) => {
        const next = value.filter((v) => v !== id);
        onChange(next);
      },
      [value, onChange]
    );

    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {value.length === 0 && (
            <span className="text-gray-400" style={{ fontSize }}>
              —
            </span>
          )}
          {value.map((id) => {
            const opt = options.find((o) => String(o.id) === String(id));
            return (
              <span
                key={id}
                className={classNames(
                  "inline-flex items-center px-2 py-0 font-medium border rounded truncate",
                  opt ? getColor(opt.name) : "bg-indigo-50 text-indigo-700 border-indigo-200"
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
                <MultiReferenceTag
                  value={opt?.name || "—"}
                  fontSize={fontSize}
                  rowHeight={rowHeight}
                  truncate
                />
                <Cross2Icon
                  className="ml-1 w-4 h-4 cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => handleRemoveTag(id)}
                />
              </span>
            );
          })}
        </div>
        <Select.Root
          open={open}
          onOpenChange={handleOpenChange}
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
            onClick={() => setOpen(true)}
          >
            <span className="mr-2 text-gray-400">Add...</span>
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
                      value.includes(opt.id) && "ring-2 ring-indigo-400"
                    )}
                    style={{
                      fontSize,
                      minHeight: minH,
                      lineHeight: lh,
                      transition: "background 0.15s",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleValueChange(opt.id);
                    }}
                  >
                    <Select.ItemText>
                      <MultiReferenceTag
                        value={opt.name}
                        fontSize={fontSize}
                        rowHeight={rowHeight}
                        truncate
                      />
                    </Select.ItemText>
                    {value.includes(opt.id) && (
                      <CheckIcon className="ml-2 w-4 h-4 text-indigo-500" />
                    )}
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    );
  }
);

MultiReferenceList.displayName = "MultiReferenceList";

export default MultiReferenceList;
