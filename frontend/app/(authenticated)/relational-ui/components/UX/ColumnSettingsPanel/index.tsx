"use client";

import React, { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { ColumnDataType, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { useTableSettings } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { getFontVars } from "@/components/settings/font/FontSizeVarsProvider";

import NameInput from "./NameInput";
import TypeSelector from "./TypeSelector";
import ChoiceOptionsEditor from "./ChoiceOptionsEditor";
import ReferenceOptionsEditor from "./ReferenceOptionsEditor";
import CurrencySelector from "./CurrencySelector";
import FormulaInput from "./FormulaInput";
import GridOptionsSection from "./GridOptionsSection";
import FontSizePresetsSection from "./FontSizePresetsSection";
import { FONT_SIZE_PRESETS } from "../FontSizeSlider";

export interface ChoiceOption {
  id: string;
  name: string;
  color?: string;
}
export interface ReferenceOption {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  column: CustomColumnDef<unknown> | null;
  onClose: () => void;
  onUpdate: (updated: CustomColumnDef<unknown>) => void;
  fontSizeIdx: number;
  setFontSizeIdx: (idx: number) => void;
  presets: typeof FONT_SIZE_PRESETS;
}

export default function ColumnSettingsPanel({
  column,
  onClose,
  onUpdate,
}: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ColumnDataType>("text");
  const [formula, setFormula] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [choices, setChoices] = useState<ChoiceOption[]>([]);
  const [references, setReferences] = useState<ReferenceOption[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Table font/row settings
  const { fontSizeIdx, setFontSizeIdx, presets, zebraStriping, setZebraStriping } = useTableSettings();
  const preset = presets[fontSizeIdx];
  const fontVars = getFontVars(preset.value);

  // Initial load
  useEffect(() => {
    if (!column) return;
    setName(column.header?.toString() || "");
    setType(column.type || "text");
    setFormula(
      column.type === "formula" && "formula" in column
        ? (column as CustomColumnDef<unknown> & { formula: string }).formula || ""
        : ""
    );
    setCurrencyCode(column.currencyCode || "USD");
    // Choices
    if (column.type === "choice" && Array.isArray(column.choices)) {
      setChoices(
        (column.choices as any[]).map((c: any) =>
          typeof c === "string"
            ? { id: c, name: c }
            : { id: c.id || c.name, name: c.name || c.id, color: c.color }
        )
      );
    } else {
      setChoices([]);
    }
    // References
    if (column.type === "reference" && Array.isArray(column.referenceData)) {
      setReferences(
        (column.referenceData as any[]).map((r: any) =>
          typeof r === "string"
            ? { id: r, name: r }
            : { id: r.id || r.name, name: r.name || r.id }
        )
      );
    } else {
      setReferences([]);
    }
  }, [column]);

  // Save logic
  const handleSave = () => {
    if (!column || !name.trim()) return;
    const updated: CustomColumnDef<unknown> = {
      ...column,
      header: name.trim(),
      type,
      ...(type === "currency" && { currencyCode }),
      ...(type === "formula" && { formula }),
      ...(type === "choice" && { choices }),
      ...(type === "reference" && { referenceData: references }),
    };
    onUpdate(updated);
    onClose();
  };

  return (
    <div
      className="flex flex-col h-full w-full bg-white dark:bg-gray-900 overflow-y-auto max-h-screen"
      style={fontVars}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2" style={{ fontSize: "var(--h2)" }}>
          <span className="text-xl">⚙️</span> Column Settings
        </h2>
        <button onClick={onClose} aria-label="Close">
          <XIcon className="w-5 h-5 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

        <NameInput value={name} onChange={setName} type={type} />

        <TypeSelector value={type} onChange={setType} />

        {type === "choice" && (
          <ChoiceOptionsEditor choices={choices} setChoices={setChoices} />
        )}

        {type === "reference" && (
          <ReferenceOptionsEditor references={references} setReferences={setReferences} />
        )}

        {type === "currency" && (
          <CurrencySelector value={currencyCode} onChange={setCurrencyCode} />
        )}

        {type === "formula" && (
          <FormulaInput value={formula} onChange={setFormula} />
        )}

        <GridOptionsSection
          zebraStriping={zebraStriping}
          setZebraStriping={setZebraStriping}
        />

        <FontSizePresetsSection
          fontSizeIdx={fontSizeIdx}
          setFontSizeIdx={setFontSizeIdx}
          presets={presets}
        />

      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-white dark:bg-gray-900 dark:border-gray-700">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-base font-medium hover:bg-blue-700 transition-colors"
          style={{ fontSize: "var(--body)" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
