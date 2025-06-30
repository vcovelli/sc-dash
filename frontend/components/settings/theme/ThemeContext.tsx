"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type ThemeContextType = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");

  // On mount, read from localStorage or system
  useEffect(() => {
    let m: ThemeMode = "system";
    if (typeof window !== "undefined") {
      m = (localStorage.getItem("theme-mode") as ThemeMode) || "system";
      setModeState(m);
    }
  }, []);

  // Write to localStorage and <html> when mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("theme-mode", mode);
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    if (effective === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const toggle = () =>
    setModeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("Must wrap app in ThemeProvider");
  return ctx;
}
