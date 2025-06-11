"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ContextMenuProps {
  position: { x: number; y: number };
  rowIndex: number | null;
  colIndex: number | null;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onDuplicateRow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onRenameColumn: () => void;
  onHideColumn: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onFilterColumn: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  rowIndex,
  colIndex,
  onInsertAbove,
  onInsertBelow,
  onDuplicateRow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onRenameColumn,
  onHideColumn,
  onSortAsc,
  onSortDesc,
  onFilterColumn,
  onClose,
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  const isRowHeader = rowIndex !== null && colIndex === 0;
  const isColHeader = rowIndex === -1;
  const isDataCell = rowIndex !== null && rowIndex >= 0 && colIndex !== null && colIndex > 0;

  const menu = (
    <div
      role="menu"
      className="fixed z-[9999] w-64 rounded-xl border border-gray-300 bg-white/95 text-sm shadow-lg
      dark:border-gray-700 dark:bg-gray-700/95 dark:text-white
      backdrop-blur-sm"
      style={{ top: position.y, left: position.x }}
    >
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {(isRowHeader || isDataCell) && (
          <>
            <li
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onInsertAbove}
            >
              ➕ Insert row above <span className="float-right text-gray-400">⌃⇧↵</span>
            </li>
            <li
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onInsertBelow}
            >
              ➕ Insert row below <span className="float-right text-gray-400">⌃↵</span>
            </li>
            <li
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onDuplicateRow}
            >
              📄 Duplicate row <span className="float-right text-gray-400">⌃⇧D</span>
            </li>
            <li
              className="px-4 py-2 cursor-pointer text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onDeleteRow}
            >
              🗑️ Delete row <span className="float-right text-gray-400">⌃⌫</span>
            </li>
          </>
        )}

        {(isColHeader || isDataCell) && (
          <>
            <li
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onInsertColLeft}
            >
              ↖️ Insert column left <span className="float-right text-gray-400">⌥⇧=</span>
            </li>
            <li
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onInsertColRight}
            >
              ↘️ Insert column right <span className="float-right text-gray-400">⌥=</span>
            </li>

            {isColHeader && (
              <>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onRenameColumn}
                >
                  ✏️ Rename column <span className="float-right text-gray-400">⌘R</span>
                </li>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onHideColumn}
                >
                  🙈 Hide column <span className="float-right text-gray-400">⌘H</span>
                </li>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onSortAsc}
                >
                  🔼 Sort ascending <span className="float-right text-gray-400">⌘↑</span>
                </li>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onSortDesc}
                >
                  🔽 Sort descending <span className="float-right text-gray-400">⌘↓</span>
                </li>
                <li
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={onFilterColumn}
                >
                  🔍 Filter column <span className="float-right text-gray-400">⌘F</span>
                </li>
              </>
            )}

            <li
              className="px-4 py-2 cursor-pointer text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onDeleteCol}
            >
              🗑️ Delete column <span className="float-right text-gray-400">⌘⌫</span>
            </li>
          </>
        )}
      </ul>
    </div>
  );

  // Don't try to portal on the server (for SSR safety)
  if (typeof window === "undefined") return null;

  // Use a portal to render the context menu at the document body
  return createPortal(menu, document.body);
};

export default ContextMenu;
