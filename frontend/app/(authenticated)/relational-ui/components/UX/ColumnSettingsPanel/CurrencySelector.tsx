"use client";
import React from "react";

interface CurrencyOption {
  code: string;
  label: string;
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "CHF", label: "Swiss Franc (Fr)" },
  { code: "CNY", label: "Chinese Yuan (¥)" },
  { code: "INR", label: "Indian Rupee (₹)" },
];

interface Props {
  value: string;
  onChange: (code: string) => void;
}

const CurrencySelector: React.FC<Props> = ({ value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-1">
      Currency Type
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    >
      {CURRENCY_OPTIONS.map(cur => (
        <option key={cur.code} value={cur.code}>
          {cur.label}
        </option>
      ))}
    </select>
  </div>
);

export default CurrencySelector;
