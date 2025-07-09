import React, { useState } from "react";
import { nanoid } from "nanoid";

export default function ReferenceOptionsEditor({
  references,
  setReferences,
}: {
  references: { id: string; name: string }[];
  setReferences: (updater: (arr: { id: string; name: string }[]) => { id: string; name: string }[]) => void;
}) {
  const [newReference, setNewReference] = useState("");

  const handleAddReference = () => {
    const val = newReference.trim();
    if (!val) return;
    setReferences(rs => [
      ...rs,
      { id: nanoid(), name: val }
    ]);
    setNewReference("");
  };

  const handleRemoveReference = (idx: number) => {
    setReferences(rs => rs.filter((_, i) => i !== idx));
  };

  const handleChangeReferenceName = (idx: number, newName: string) => {
    setReferences(rs => rs.map((r, i) => i === idx ? { ...r, name: newName } : r));
  };

  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Reference Options</label>
      <div className="space-y-2">
        {references.map((ref, idx) => (
          <div
            key={ref.id}
            className="flex items-center gap-3 py-1 px-2 rounded group bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
          >
            <input
              value={ref.name}
              onChange={e => handleChangeReferenceName(idx, e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border rounded text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
              maxLength={30}
            />
            <button
              type="button"
              onClick={() => handleRemoveReference(idx)}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              title="Remove reference"
            >
              ×
            </button>
          </div>
        ))}
        {/* Add Reference Row */}
        <div className="flex items-center gap-2 mt-3 px-2">
          <input
            value={newReference}
            onChange={e => setNewReference(e.target.value)}
            className="flex-1 min-w-0 px-2 py-1 border rounded text-xs overflow-hidden"
            placeholder="Add reference…"
            onKeyDown={e => e.key === "Enter" && handleAddReference()}
            maxLength={30}
          />
          <button
            onClick={handleAddReference}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex-shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
