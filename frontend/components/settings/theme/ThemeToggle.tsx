"use client";
import { useTheme } from "@/components/settings/theme/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();

  // Figure out the actual effective mode for icon (respects "system" mode)
  let isDark = false;
  if (mode === "dark") isDark = true;
  if (mode === "system" && typeof window !== "undefined") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return (
    <button
      onClick={toggle}
      className="ml-2 flex items-center px-2 py-1 rounded transition bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-800"
      title="Toggle light/dark mode"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? (
        <FaSun className="text-yellow-400" />
      ) : (
        <FaMoon className="text-blue-700" />
      )}
      <span className="ml-2 text-xs text-gray-600 dark:text-gray-200">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
