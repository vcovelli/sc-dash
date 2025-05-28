"use client";

import React, { useEffect, useRef, useState } from "react";

interface RenameColumnModalProps {
  position: { x: number; y: number };
  initialName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

const RenameColumnModal: React.FC<RenameColumnModalProps> = ({
  position,
  initialName,
  onRename,
  onClose,
}) => {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onRename(value.trim());
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      className="absolute z-50 w-64 bg-white border shadow-xl rounded-md p-3 rename-modal"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="block text-xs text-gray-500 mb-1">Rename Column</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex justify-end mt-2 gap-2">
        <button
          onClick={onClose}
          className="text-sm px-2 py-1 text-gray-500 hover:text-black"
        >
          Cancel
        </button>
        <button
          onClick={() => onRename(value.trim())}
          className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default RenameColumnModal;
