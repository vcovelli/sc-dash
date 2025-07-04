import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, PlusCircledIcon, CheckIcon } from "@radix-ui/react-icons";
import classNames from "classnames";

interface ChoiceOption {
  id: string;
  name: string;
  color?: string;
}

interface ChoiceListProps {
  value: string;
  options: string[] | ChoiceOption[];
  onChange: (value: string) => void;
  onEditComplete?: () => void;
  fontSize: number;
  rowHeight: number;
  autoFocus?: boolean;
  openOnFocus?: boolean;
  onAddChoice?: (newName: string, color?: string) => Promise<ChoiceOption | null> | ChoiceOption | null;
}

const COLORS = [
  "#7e5bef", "#fbbf24", "#f87171", "#10b981", "#3b82f6",
  "#6366f1", "#eab308", "#d97706", "#ec4899", "#0ea5e9",
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const DEFAULT_COLOR = "#2563eb"; // fallback blue

const getPaddingForSize = (fontSize: number) => {
  if (fontSize <= 12) return { py: "py-[6px]", minH: 24, lh: 1.5 };     // XS
  if (fontSize === 13) return { py: "py-[7px]", minH: 28, lh: 1.5 };    // Small
  if (fontSize === 14) return { py: "py-[8px]", minH: 32, lh: 1.5 };    // Default
  if (fontSize === 16) return { py: "py-[9px]", minH: 36, lh: 1.5 };    // Large
  return { py: "py-[10px]", minH: 40, lh: 1.5 };                        // XL+
};

const ChoiceList: React.FC<ChoiceListProps> = React.memo(({
  value,
  options,
  onChange,
  onEditComplete,
  autoFocus = false,
  openOnFocus = true,
  fontSize,
  rowHeight,
  onAddChoice,
}) => {
  // Normalize options to objects with optional color
  const isChoiceObject = typeof options[0] === "object" && "id" in options[0] && "name" in options[0];
  const normalizedOptions: ChoiceOption[] = isChoiceObject
    ? (options as ChoiceOption[])
    : (options as string[]).map((opt) => ({ id: opt, name: opt }));

  // Helper to get current option object by value
  const getOption = (val: string) => normalizedOptions.find((opt) => opt.id === val);

  // Sizing
  const { py, minH, lh } = getPaddingForSize(fontSize);

  // State
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newChoice, setNewChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    window.addEventListener("transitionrun", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("transitionrun", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  // Keyboard/auto-focus logic
  useEffect(() => {
    completedRef.current = false;
    if (autoFocus && openOnFocus) {
      requestAnimationFrame(() => setOpen(true));
    }
  }, [autoFocus, openOnFocus]);

  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [adding]);

  const safeComplete = useCallback(() => {
    if (!completedRef.current && onEditComplete) {
      completedRef.current = true;
      requestAnimationFrame(() => onEditComplete());
    }
  }, [onEditComplete]);

  // Handlers
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
        setAdding(false);
        setNewChoice("");
        safeComplete();
      }
    },
    [safeComplete]
  );

  // Add new option
  const handleAddNew = async () => {
    if (!onAddChoice || !newChoice.trim()) return;
    setLoading(true);
    try {
      const color = getRandomColor();
      const created = await onAddChoice(newChoice.trim(), color);
      if (created) {
        onChange(created.id);
        setOpen(false);
        safeComplete();
      }
    } finally {
      setLoading(false);
      setAdding(false);
      setNewChoice("");
    }
  };

  // --- UI Render ---
  // The color logic: use .color if present, else fallback
  const colorStyle = (opt: ChoiceOption | undefined) =>
    opt?.color
      ? {
          background: opt.color,
          borderColor: opt.color,
          color: "#fff",
        }
      : {
          background: DEFAULT_COLOR,
          borderColor: DEFAULT_COLOR,
          color: "#fff",
        };

  // Choose label text color for add button/input
  const addTextColor = isDark ? "text-blue-400" : "text-blue-600";
  const addHoverBg = isDark ? "hover:bg-neutral-800" : "hover:bg-blue-50";

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
        {normalizedOptions.length === 0 ? (
          <span className="w-full" />
        ) : (
          <span
            className={classNames(
              "inline-flex items-center px-2 py-0 font-medium border rounded truncate"
            )}
            style={{
              maxWidth: "100%",
              fontWeight: 500,
              fontSize,
              height: rowHeight - 6,
              minHeight: rowHeight - 6,
              lineHeight: `${rowHeight}px`,
              ...colorStyle(getOption(value))
            }}
          >
            {getOption(value)?.name ?? value}
          </span>
        )}
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
          <Select.Viewport className="p-1 flex flex-col">
            {/* Existing options */}
            {normalizedOptions.length > 0 && !adding &&
              normalizedOptions.map((opt) => (
                <Select.Item
                  key={opt.id}
                  value={opt.id}
                  className={classNames(
                    `px-2 ${py} mb-1 last:mb-0 hover:bg-blue-50 dark:hover:bg-neutral-800 focus:bg-blue-100 dark:focus:bg-neutral-800 cursor-pointer rounded flex items-center gap-2 outline-none`,
                    value === opt.id && "ring-2 ring-blue-400"
                  )}
                  style={{
                    fontSize,
                    minHeight: minH,
                    lineHeight: lh,
                    transition: "background 0.15s",
                  }}
                >
                  <Select.ItemText>
                    <span
                      className={classNames(
                        "inline-flex items-center px-2 py-0 rounded font-medium border truncate"
                      )}
                      style={{
                        fontSize,
                        minHeight: minH - 4,
                        height: minH - 4,
                        lineHeight: lh,
                        ...colorStyle(opt)
                      }}
                    >
                      {opt.name}
                    </span>
                  </Select.ItemText>
                  {value === opt.id && (
                    <CheckIcon className="ml-2 w-4 h-4 text-blue-500" />
                  )}
                </Select.Item>
              ))}
            {/* Show only the + button if no options and not adding */}
            {normalizedOptions.length === 0 && !adding && (
              <button
                className={`flex items-center justify-center w-full h-10 ${addHoverBg} rounded`}
                style={{ minHeight: minH }}
                onClick={() => setAdding(true)}
                type="button"
                tabIndex={0}
              >
                <PlusCircledIcon className={`w-5 h-5 ${addTextColor}`} />
              </button>
            )}
            {/* Always render add-new at bottom if options exist */}
            {normalizedOptions.length > 0 && !adding && (
              <button
                className={classNames(
                  "flex items-center gap-2 w-full px-2 mt-1 font-medium rounded",
                  addTextColor,
                  addHoverBg
                )}
                onClick={() => setAdding(true)}
                type="button"
                tabIndex={0}
                style={{
                  fontSize,
                  justifyContent: "center",
                  minHeight: minH,
                  lineHeight: lh,
                }}
              >
                <PlusCircledIcon className="w-4 h-4" />
                Add new option
              </button>
            )}
            {/* Inline add input */}
            {adding && (
              <div className={`flex items-center gap-2 px-2 ${py} mt-1 bg-gray-50 dark:bg-neutral-800 rounded`}>
                <input
                  ref={inputRef}
                  className="border rounded px-2 py-1 w-full bg-white dark:bg-neutral-900"
                  style={{ fontSize, height: minH - 8, color: isDark ? "#cbd5e1" : "#1e293b" }}
                  value={newChoice}
                  placeholder="Add option…"
                  onChange={e => setNewChoice(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddNew();
                    if (e.key === "Escape") { setAdding(false); setNewChoice(""); }
                  }}
                  disabled={loading}
                />
                <button
                  className={classNames("text-xs px-2 py-1 rounded font-semibold", addTextColor, addHoverBg)}
                  onClick={handleAddNew}
                  disabled={loading || !newChoice.trim()}
                  tabIndex={0}
                  style={{ minWidth: 44 }}
                >Add</button>
                <button
                  className={classNames("text-xs px-2 py-1 rounded font-semibold", isDark ? "text-gray-400 hover:bg-neutral-700" : "text-gray-500 hover:bg-gray-100")}
                  onClick={() => { setAdding(false); setNewChoice(""); }}
                  tabIndex={0}
                  style={{ minWidth: 44 }}
                >Cancel</button>
              </div>
            )}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
});

ChoiceList.displayName = "ChoiceList";

export default ChoiceList;
