import React from "react";

export default function ModalItem({
  icon,
  label,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded
        ${disabled
          ? "opacity-60 cursor-not-allowed hover:bg-transparent"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium"
        }`}
      disabled={disabled}
      style={{ fontSize: "var(--body)" }}
    >
      {icon} {label}
    </button>
  );
}
