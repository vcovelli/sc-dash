"use client";
import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage or OS preference
    const root = window.document.documentElement;
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="ml-2 flex items-center px-2 py-1 rounded transition bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-800"
      title="Toggle light/dark mode"
      aria-label="Toggle theme"
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
