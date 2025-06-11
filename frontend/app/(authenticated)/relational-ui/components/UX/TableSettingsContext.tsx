import React, { createContext, useContext, useState } from "react";

const FONT_SIZE_PRESETS = [
  { value: "xs", label: "XS", fontSize: 12, rowHeight: 18 },
  { value: "sm", label: "Small", fontSize: 13, rowHeight: 20 },
  { value: "base", label: "Default", fontSize: 14, rowHeight: 24 },
  { value: "lg", label: "Large", fontSize: 16, rowHeight: 28 },
  { value: "xl", label: "XL", fontSize: 18, rowHeight: 34 },
];

type TableSettings = {
  fontSizeIdx: number;
  setFontSizeIdx: (idx: number) => void;
  fontSize: number;
  rowHeight: number;
  presets: typeof FONT_SIZE_PRESETS;
  zebraStriping: boolean;
  setZebraStriping: (val: boolean) => void;
};

const TableSettingsContext = createContext<TableSettings | undefined>(undefined);

// Add prop for initial font size idx
export function TableSettingsProvider({
  children,
  initialFontSizeIdx = 2,
  fontSizeIdx: controlledIdx,
  setFontSizeIdx: controlledSetter,
}: {
  children: React.ReactNode;
  initialFontSizeIdx?: number;
  fontSizeIdx?: number;
  setFontSizeIdx?: (idx: number) => void;
}) {
  const [uncontrolledIdx, setUncontrolledIdx] = useState(initialFontSizeIdx);
  const fontSizeIdx = controlledIdx !== undefined ? controlledIdx : uncontrolledIdx;
  const setFontSizeIdx = controlledSetter || setUncontrolledIdx;
  const [zebraStriping, setZebraStriping] = useState(true);

  const ctxValue: TableSettings = {
    fontSizeIdx,
    setFontSizeIdx,
    fontSize: FONT_SIZE_PRESETS[fontSizeIdx].fontSize,
    rowHeight: FONT_SIZE_PRESETS[fontSizeIdx].rowHeight,
    presets: FONT_SIZE_PRESETS,
    zebraStriping,
    setZebraStriping,
  };

  return (
    <TableSettingsContext.Provider value={ctxValue}>
      {children}
    </TableSettingsContext.Provider>
  );
}

export function useTableSettings() {
  const ctx = useContext(TableSettingsContext);
  if (!ctx) throw new Error("useTableSettings must be used within TableSettingsProvider");
  return ctx;
}
