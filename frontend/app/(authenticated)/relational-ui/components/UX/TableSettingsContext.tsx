"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUserSettings } from "@/components/UserSettingsContext";
import { FONT_SIZE_PRESETS } from "@/components/settings/font/FontSizeDropdown";

type TableSettings = {
  fontSizeIdx: number;
  setFontSizeIdx: React.Dispatch<React.SetStateAction<number>>;
  fontSize: number;
  rowHeight: number;
  presets: typeof FONT_SIZE_PRESETS;
  zebraStriping: boolean;
  setZebraStriping: (val: boolean) => void;
  showSystemColumns: boolean;
  setShowSystemColumns: (val: boolean) => void;
};

const TableSettingsContext = createContext<TableSettings | undefined>(undefined);

// Session-based font size management for relational-ui
function useRelationalUIFontSize() {
  const { settings: globalSettings } = useUserSettings();

  // Get global font size index as default
  const globalFontSizeIdx = Math.max(
    0,
    FONT_SIZE_PRESETS.findIndex(
      (preset) => preset.value === (globalSettings.fontSize || "base")
    )
  );

  // Initialize with session storage or global setting
  const [fontSizeIdx, setFontSizeIdx] = useState(() => {
    if (typeof window !== "undefined") {
      const sessionFontSize = sessionStorage.getItem(
        "relational-ui-font-size-idx"
      );
      return sessionFontSize
        ? parseInt(sessionFontSize, 10)
        : globalFontSizeIdx;
    }
    return globalFontSizeIdx;
  });

  // Save to session storage when changed
  const updateFontSizeIdx: React.Dispatch<React.SetStateAction<number>> = (
    idxOrUpdater
  ) => {
    setFontSizeIdx((prev) => {
      const next =
        typeof idxOrUpdater === "function" ? idxOrUpdater(prev) : idxOrUpdater;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("relational-ui-font-size-idx", next.toString());
      }
      return next;
    });
  };

  // Reset to global setting when global settings change (if user updates profile)
  useEffect(() => {
    const newGlobalIdx = Math.max(
      0,
      FONT_SIZE_PRESETS.findIndex(
        (preset) => preset.value === (globalSettings.fontSize || "base")
      )
    );
    // Only reset if user hasn't made local changes in this session
    if (
      typeof window !== "undefined" &&
      !sessionStorage.getItem("relational-ui-font-size-idx")
    ) {
      setFontSizeIdx(newGlobalIdx);
    }
  }, [globalSettings.fontSize]);

  return { fontSizeIdx, setFontSizeIdx: updateFontSizeIdx };
}

export function TableSettingsProvider({
  children,
  fontSizeIdx: controlledIdx,
  setFontSizeIdx: controlledSetter,
}: {
  children: React.ReactNode;
  fontSizeIdx?: number;
  setFontSizeIdx?: React.Dispatch<React.SetStateAction<number>>;
}) {
  const sessionFontSize = useRelationalUIFontSize();
  const [zebraStriping, setZebraStriping] = useState(true);
  const [showSystemColumns, setShowSystemColumns] = useState(false);

  // Use session-based font size or controlled props
  const fontSizeIdx =
    controlledIdx !== undefined ? controlledIdx : sessionFontSize.fontSizeIdx;
  const setFontSizeIdx =
    controlledSetter || sessionFontSize.setFontSizeIdx;

  const ctxValue: TableSettings = {
    fontSizeIdx,
    setFontSizeIdx,
    fontSize: FONT_SIZE_PRESETS[fontSizeIdx].fontSize,
    rowHeight: FONT_SIZE_PRESETS[fontSizeIdx].rowHeight,
    presets: FONT_SIZE_PRESETS,
    zebraStriping,
    setZebraStriping,
    showSystemColumns,
    setShowSystemColumns,
  };

  return (
    <TableSettingsContext.Provider value={ctxValue}>
      {children}
    </TableSettingsContext.Provider>
  );
}

export function useTableSettings() {
  const ctx = useContext(TableSettingsContext);
  if (!ctx)
    throw new Error(
      "useTableSettings must be used within TableSettingsProvider"
    );
  return ctx;
}
