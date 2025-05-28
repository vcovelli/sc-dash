import React, { useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import classNames from "classnames";

interface ChoiceOption {
  id: string;
  name: string;
}

interface ChoiceListProps {
  value: string;
  options: string[] | ChoiceOption[];
  onChange: (value: string) => void;
  onEditComplete?: () => void; // ✅ added support
  getColor?: (value: string) => string;
  autoFocus?: boolean;
}

const ChoiceList: React.FC<ChoiceListProps> = ({
  value,
  options,
  onChange,
  onEditComplete,
  getColor = () => "bg-gray-200 text-gray-800 border border-gray-300",
  autoFocus = false,
}) => {
  const isChoiceObject =
    typeof options[0] === "object" && "id" in options[0] && "name" in options[0];

  const normalizedOptions: ChoiceOption[] = isChoiceObject
    ? (options as ChoiceOption[])
    : (options as string[]).map((opt) => ({ id: opt, name: opt }));

  const getLabel = (val: string) => {
    return normalizedOptions.find((opt) => opt.id === val)?.name || val;
  };

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => setOpen(true), 0);
    }
  }, [autoFocus]);

  const handleValueChange = (val: string) => {
    onChange(val);
    setOpen(false);

    if (val === value && onEditComplete) {
      setTimeout(onEditComplete, 0);
    }
  };

  return (
    <Select.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen && onEditComplete) {
          setTimeout(onEditComplete, 0);
        }
      }}
      value={value}
      onValueChange={handleValueChange}
    >
      <Select.Trigger
        ref={triggerRef}
        data-autofocus-select
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="inline-flex items-center justify-between w-full px-2 py-1 border border-gray-300 rounded bg-white text-sm shadow-sm focus:outline-none"
      >
        <span
          className={classNames(
            "inline-block px-2 py-0.5 rounded text-xs font-medium border",
            getColor(getLabel(value))
          )}
        >
          {getLabel(value)}
        </span>
        <Select.Icon className="ml-1">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          avoidCollisions
          position="popper"
          sideOffset={5}
          className="bg-white rounded shadow-lg border border-gray-200 z-50"
        >
          <Select.Viewport className="p-1">
            {normalizedOptions.map((opt) => (
              <Select.Item
                key={opt.id}
                value={opt.id}
                className="px-3 py-1.5 text-sm hover:bg-blue-50 focus:bg-blue-100 cursor-pointer rounded flex items-center gap-2 outline-none"
              >
                <Select.ItemText>
                  <span
                    className={classNames(
                      "inline-block px-2 py-0.5 rounded text-xs font-medium border",
                      getColor(opt.name)
                    )}
                  >
                    {opt.name}
                  </span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default ChoiceList;
