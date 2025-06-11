import React, { useRef, useState, useEffect } from "react";
import { PlusIcon } from "lucide-react";
import ColumnTypeMenu from "./ColumnTypeMenu";
import { ColumnDataType } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface Props {
  onAddColumn: (type: ColumnDataType) => void;
  fontSize: number;
  rowHeight: number;
}

export default function AddColumnButton({ onAddColumn, fontSize, rowHeight }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("add-column-dropdown");
      const button = btnRef.current;
      if (
        dropdown &&
        !dropdown.contains(e.target as Node) &&
        button &&
        !button.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Improved: Calculate dropdown position to avoid overflow
  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    const dropdownWidth = 260; // px, slightly wider than 256 for padding
    const dropdownHeight = 340; // px, estimated menu height

    let x = rect ? rect.left : 0;
    let y = rect ? rect.bottom : 0;

    const maxX = window.innerWidth - dropdownWidth - 10;
    const maxY = window.innerHeight - dropdownHeight - 10;
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;

    setMenuPos({ x, y });
    setShowDropdown(true);
  };

  return (
    <>
      <div
        ref={btnRef}
        className="border-r border-gray-300 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
        style={{
          fontSize,
          height: rowHeight,
          minHeight: rowHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={openMenu}
      >
        <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </div>
      {showDropdown && menuPos && (
        <ColumnTypeMenu
          anchorPos={menuPos}
          onSelect={type => {
            setShowDropdown(false);
            onAddColumn(type);
          }}
        />
      )}
    </>
  );
}
