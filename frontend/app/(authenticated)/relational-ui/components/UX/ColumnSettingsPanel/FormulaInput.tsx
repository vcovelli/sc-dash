"use client";
import React from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const FormulaInput: React.FC<Props> = ({ value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
      Formula
    </label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-20 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      placeholder="Enter formula here"
    />
  </div>
);

export default FormulaInput;
