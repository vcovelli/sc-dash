import React, { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import ReferenceTag from "./ReferenceTag";

interface ReferenceOption {
  id: string;
  name: string;
}

interface ReferenceListProps {
  value: string;
  options: ReferenceOption[];
  onChange: (value: string) => void;
  onEditComplete?: () => void; // ✅ added
  autoFocus?: boolean;
  getColor?: (name: string) => string;
}

const ReferenceList: React.FC<ReferenceListProps> = ({
  value,
  options,
  onChange,
  onEditComplete,
  autoFocus = false,
  getColor = () => "bg-indigo-100 text-indigo-800 border border-indigo-300",
}) => {
  const getLabel = (val: string) => {
    return options.find((opt) => opt.id === val)?.name || val;
  };

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => setOpen(true), 0);
    }
  }, [autoFocus]);

  const handleValueChange = (val: string) => {
    console.log("🔵 ReferenceList emitted value:", val);
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
        data-autofocus-select
        className="inline-flex items-center justify-between w-full px-2 py-1 border border-indigo-300 rounded bg-white text-sm shadow-sm focus:outline-none"
      >
        <ReferenceTag value={getLabel(value)} />
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
            {options.map((opt) => (
              <Select.Item
                key={opt.id}
                value={opt.id}
                className="px-3 py-1.5 text-sm hover:bg-indigo-50 focus:bg-indigo-100 cursor-pointer rounded flex items-center gap-2 outline-none"
              >
                <Select.ItemText>
                  <ReferenceTag value={opt.name} />
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default ReferenceList;
