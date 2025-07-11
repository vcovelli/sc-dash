"use client";

import React, { useEffect } from "react";
import { useUserSettings } from "@/components/UserSettingsContext";
import { usePathname } from "next/navigation";

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

export default function FontSizeVarsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettings();
  const pathname = usePathname();
  const fontVars = getFontVars(settings.fontSize || "base");

  // Check if we're on the relational-ui page - exclude it from global font settings
  const isRelationalUIPage = pathname ? pathname.includes('/relational-ui') : false;

  // Apply to <body> only if NOT on relational-ui page
  useEffect(() => {
    if (!isRelationalUIPage) {
      for (const [k, v] of Object.entries(fontVars)) {
        document.body.style.setProperty(k, v);
      }
    }
  }, [fontVars, isRelationalUIPage]);

  return <>{children}</>;
}
