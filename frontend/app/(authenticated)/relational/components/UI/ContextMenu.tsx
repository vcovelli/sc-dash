"use client";

import React, { useEffect } from "react";

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

  return (
    <div
      className="absolute bg-white border border-gray-300 shadow-lg z-50 rounded-md text-sm w-64"
      style={{ top: position.y, left: position.x }}
    >
      <ul className="divide-y divide-gray-200">
        {/* Row Actions */}
        {(isRowHeader || isDataCell) && (
          <>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onInsertAbove}>
              ➕ Insert row above <span className="float-right text-gray-400">⌃⇧↵</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onInsertBelow}>
              ➕ Insert row below <span className="float-right text-gray-400">⌃↵</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onDuplicateRow}>
              📄 Duplicate row <span className="float-right text-gray-400">⌃⇧D</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600" onClick={onDeleteRow}>
              🗑️ Delete row <span className="float-right text-gray-400">⌃⌫</span>
            </li>
          </>
        )}

        {/* Column Actions */}
        {(isColHeader || isDataCell) && (
          <>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onInsertColLeft}>
              ↖️ Insert column left <span className="float-right text-gray-400">⌥⇧=</span>
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onInsertColRight}>
              ↘️ Insert column right <span className="float-right text-gray-400">⌥=</span>
            </li>
            {isColHeader && (
              <>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onRenameColumn}>
                  ✏️ Rename column <span className="float-right text-gray-400">⌘R</span>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onHideColumn}>
                  🙈 Hide column <span className="float-right text-gray-400">⌘H</span>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onSortAsc}>
                  🔼 Sort ascending <span className="float-right text-gray-400">⌘↑</span>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onSortDesc}>
                  🔽 Sort descending <span className="float-right text-gray-400">⌘↓</span>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={onFilterColumn}>
                  🔍 Filter column <span className="float-right text-gray-400">⌘F</span>
                </li>
              </>
            )}
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600" onClick={onDeleteCol}>
              🗑️ Delete column <span className="float-right text-gray-400">⌘⌫</span>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default ContextMenu;
