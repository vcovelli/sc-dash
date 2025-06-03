"use client";

import React, { useEffect } from "react";
import { useUserSettings } from "@/components/UserSettingsContext";

// Updated to support both fontSize and rowHeight (if you want global row height as a variable too)
export function getFontVars(fontSize: string | number, rowHeight?: number) {
  // If fontSize is a string, map it to a number (so we can compute rowHeight if needed)
  let size =
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
  let row = rowHeight ?? Math.round(size * 1.7);

  return {
    "--body": `${size}px`,
    "--row": `${row}px`,
    "--h1": `${Math.round(size * 1.6)}px`,
    "--h2": `${Math.round(size * 1.3)}px`,
    "--small": `${Math.round(size * 0.9)}px`,
  } as React.CSSProperties;
}

export default function FontSizeVarsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettings();
  const fontVars = getFontVars(settings.fontSize || "base", settings.rowHeight);

  // Apply to <body>
  useEffect(() => {
    for (const [k, v] of Object.entries(fontVars)) {
      document.body.style.setProperty(k, v);
    }
  }, [fontVars]);

  // Optionally: You can also wrap children with a div to enforce inheritance:
  // return <div style={fontVars}>{children}</div>;
  // Or just return children:
  return <>{children}</>;
}
