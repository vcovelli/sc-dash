"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUserSettings } from "@/components/UserSettingsContext";

type ThemeMode = "light" | "dark" | "system";
type ThemeContextType = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};
const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSetting, isLoading } = useUserSettings();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Initialize theme from global settings when they're loaded
  useEffect(() => {
    if (!isLoading && settings.theme) {
      setModeState(settings.theme);
    }
  }, [settings.theme, isLoading]);

  // Apply theme to DOM when mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effective = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    
    if (effective === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    // Update global settings which will persist to backend
    updateSetting("theme", m);
  };

  const toggle = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
  };

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
