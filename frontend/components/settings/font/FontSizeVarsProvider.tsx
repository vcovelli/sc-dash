"use client";

import React, { useEffect, createContext, useContext } from "react";
import { useUserSettings } from "@/components/UserSettingsContext";
import { usePathname } from "next/navigation";

const FontVarsContext = createContext<React.CSSProperties>({});
export const useFontVars = () => useContext(FontVarsContext);

// Updated to support both fontSize and rowHeight (if you want global row height as a variable too)
export function getFontVars(fontSize: string | number, rowHeight?: number) {
  // If fontSize is a string, map it to a number (so we can compute rowHeight if needed)
  const size =
    typeof fontSize === "number"
      ? fontSize
      : fontSize === "xs"
      ? 12
      : fontSize === "sm"
      ? 13
      : fontSize === "lg"
      ? 16
      : fontSize === "xl"
      ? 18
      : 14;

  // If not passed, compute row height
  const row = rowHeight ?? Math.round(size * 1.7);

  return {
    "--body": `${size}px`,
    "--row": `${row}px`,
    "--h1": `${Math.round(size * 1.6)}px`,
    "--h2": `${Math.round(size * 1.3)}px`,
    "--small": `${Math.round(size * 0.9)}px`,
  } as React.CSSProperties;
}

interface FontSizeVarsProviderProps {
  children: React.ReactNode;
  value?: React.CSSProperties;
}

export default function FontSizeVarsProvider({
  value,
  children,
}: FontSizeVarsProviderProps) {
  const { settings } = useUserSettings();
  const pathname = usePathname();

  // Use override value if provided, otherwise fall back to global user settings
  const fontVars = value ?? getFontVars(settings.fontSize || "base");

  // Only set <body> CSS vars outside /relational-ui
  useEffect(() => {
    if (!pathname || !pathname.includes("/relational-ui")) {
      for (const [k, v] of Object.entries(fontVars)) {
        document.body.style.setProperty(k, v);
      }
      return () => {
        for (const k of Object.keys(fontVars)) {
          document.body.style.removeProperty(k);
        }
      };
    }
  }, [fontVars, pathname]);
  // Always provide the fontVars to children via context
  return (
    <FontVarsContext.Provider value={fontVars}>
      {children}
    </FontVarsContext.Provider>
  );
}
