"use client";

import React from "react";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import FontSizeVarsProvider, { getFontVars } from "@/components/settings/font/FontSizeVarsProvider";
import SheetsPageInner from "./SheetsPageInner";

export default function SheetsPageWithFontVars() {
  const { fontSizeIdx, presets } = useTableSettings();
  const fontPreset = presets[fontSizeIdx];
  const fontVars = fontPreset ? getFontVars(fontPreset.value, fontPreset.rowHeight) : getFontVars("base");

  return (
    <FontSizeVarsProvider value={fontVars}>
      <SheetsPageInner />
    </FontSizeVarsProvider>
  );
}
