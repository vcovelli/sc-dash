import React, { useState, useEffect } from "react";
import { TableMeta, WidgetConfig, WidgetType, AllWidgetSettings, BarChartSettings, LineChartSettings, PieChartSettings, TableChartSettings } from "../../types";
import BarChartSettingsPanel from "./BarChartSettingsPanel";
import LineChartSettingsPanel from "./LineChartSettingsPanel";
import PieChartSettingsPanel from "./PieChartSettingsPanel";
import TableChartSettingsPanel from "./TableChartSettingsPanel";
import { BarChart2, LineChart, PieChart, Table } from "lucide-react";

// --- MOCK DATA ---
const MOCK_TABLES: TableMeta[] = [
  {
    name: "orders",
    columns: [
      { name: "status", type: "string" },
      { name: "date", type: "date" },
      { name: "revenue", type: "number" },
      { name: "count", type: "number" },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "category", type: "string" },
      { name: "price", type: "number" },
      { name: "units_sold", type: "number" },
    ],
  },
  {
    name: "customers",
    columns: [
      { name: "region", type: "string" },
      { name: "signup_date", type: "date" },
      { name: "lifetime_value", type: "number" },
    ],
  },
];

const NAVBAR_HEIGHT = 72;

const chartTypes = [
  { value: "bar", label: "Bar", icon: <BarChart2 className="w-5 h-5" /> },
  { value: "line", label: "Line", icon: <LineChart className="w-5 h-5" /> },
  { value: "pie", label: "Pie", icon: <PieChart className="w-5 h-5" /> },
  { value: "table", label: "Table", icon: <Table className="w-5 h-5" /> },
];

// --- Utility: Get defaults for each chart type ---
function getDefaultChartSettings(type: WidgetType): AllWidgetSettings {
  switch (type) {
    case "bar":
      return { type: "bar", table: "orders", xField: "status", yFields: ["count"], showLegend: true };
    case "line":
      return { type: "line", table: "orders", xField: "date", yFields: ["revenue"], showLegend: true };
    case "pie":
      return { type: "pie", table: "orders", xField: "status", yFields: ["count"], showLegend: true };
    case "table":
      return { type: "table", table: "orders", xField: "status", yFields: ["count"] };
    default:
      return { type: "table", table: "orders", xField: "status", yFields: [] };
  }
}

export default function SettingsPanel({
  widget,
  open,
  onClose,
  onSave,
  onExitFocus,
  onLiveUpdate,
}: {
  widget?: WidgetConfig<AllWidgetSettings>;
  open: boolean;
  onClose: () => void;
  onSave: (settings: AllWidgetSettings) => void;
  onExitFocus?: () => void;
  onLiveUpdate?: (draft: AllWidgetSettings) => void;
}) {
  const [draft, setDraft] = useState<AllWidgetSettings>(
    () => widget?.settings ?? getDefaultChartSettings(widget?.type ?? "bar")
  );
  const [draftType, setDraftType] = useState<WidgetType>(widget?.type ?? "bar");
  const [dirty, setDirty] = useState(false);
  const [showTypeChanger, setShowTypeChanger] = useState(false);

  // --- Get current table meta (typed columns) ---
  const xTable = MOCK_TABLES.find(t => t.name === draft.table) || MOCK_TABLES[0];
  const xColumns = xTable.columns.filter(
    col => col.type === "string" || col.type === "category"
  );
  const yColumns = xTable.columns.filter(col => col.type === "number");

  // --- Sync state with widget changes ---
  useEffect(() => {
    const defaults = getDefaultChartSettings(widget?.type ?? "bar");
    const incoming = widget?.settings ?? {};
    const merged: AllWidgetSettings = { ...defaults, ...incoming };

    // Patch type-specific color arrays only if present
    if (merged.type === "bar" && "barColors" in incoming) {
      (merged as BarChartSettings).barColors = (incoming as BarChartSettings).barColors;
    }
    if (merged.type === "line" && "lineColors" in incoming) {
      (merged as LineChartSettings).lineColors = (incoming as LineChartSettings).lineColors;
    }
    if (merged.type === "pie" && "pieColors" in incoming) {
      (merged as PieChartSettings).pieColors = (incoming as PieChartSettings).pieColors;
    }
    // Defensive: Always set yFields as array
    merged.yFields =
    "yFields" in incoming && Array.isArray(incoming.yFields)
      ? incoming.yFields
      : defaults.yFields;

    setDraft(merged);
    setDraftType(widget?.type ?? "bar");
    setDirty(false);
    setShowTypeChanger(false);
    // eslint-disable-next-line
  }, [widget?.id]);

  // --- Generic yField toggle (type-guarded) ---
  const toggleYField = (field: string) => {
    setDraft(d => {
      const current = d.yFields ?? [];
      const next = current.includes(field)
        ? current.filter((f: string) => f !== field)
        : [...current, field];
      const updated = { ...d, yFields: next };
      setDirty(true);
      if (onLiveUpdate) onLiveUpdate({ ...updated, type: draftType });
      return updated;
    });
  };

  const renderPanel = () => {
    switch (draftType) {
      case "bar":
        return (
          <BarChartSettingsPanel
            settings={draft as BarChartSettings}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "bar" });
            }}
            mockTables={MOCK_TABLES}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={
              (key, value) => setDraft((d) =>
                ({ ...d, [key]: value }) as BarChartSettings
              )
            }
            toggleYField={toggleYField}
          />
        );
      case "line":
        return (
          <LineChartSettingsPanel
            settings={draft as LineChartSettings}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "line" });
            }}
            mockTables={MOCK_TABLES}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={
              (key, value) => setDraft((d) =>
                ({ ...d, [key]: value }) as LineChartSettings
              )
            }
            toggleYField={toggleYField}
          />
        );
      case "pie":
        return (
          <PieChartSettingsPanel
            settings={draft as PieChartSettings}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "pie" });
            }}
            mockTables={MOCK_TABLES}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={
              (key, value) => setDraft((d) =>
                ({ ...d, [key]: value }) as PieChartSettings
              )
            }
          />
        );
      case "table":
        return (
          <TableChartSettingsPanel
            settings={draft as TableChartSettings}
            onChange={(next) => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "table" });
            }}
            mockTables={MOCK_TABLES}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={
              (key, value) => setDraft((d) =>
                ({ ...d, [key]: value }) as TableChartSettings
              )
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <aside
      className={`
        fixed top-[${NAVBAR_HEIGHT}px] right-0 h-[calc(100vh-${NAVBAR_HEIGHT}px)] z-50
        bg-white dark:bg-gray-900 shadow-xl border-l border-neutral-200 dark:border-gray-800
        p-6 transition-all duration-300 ease-in-out flex flex-col
        ${open ? "w-[420px] opacity-100" : "w-0 opacity-0 pointer-events-none"}
      `}
      style={{ overflow: "hidden" }}
    >
      {open && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-bold">Chart Settings</div>
            <button
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
              onClick={() => {
                onClose();
                if (onExitFocus) onExitFocus();
              }}
              aria-label="Close settings panel"
            >
              ✖️
            </button>
          </div>

          {/* Chart Type changer */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Chart Type:</span>
              <span className="capitalize text-blue-700 dark:text-blue-300 font-medium">
                {chartTypes.find(t => t.value === draftType)?.label}
              </span>
            </div>
            {!showTypeChanger ? (
              <button
                className="mt-2 px-3 py-1 text-xs rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-200 border border-blue-300 transition"
                onClick={() => setShowTypeChanger(true)}
              >
                Change Chart Type
              </button>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                  Changing chart type will reset chart settings to defaults.
                </div>
                <div className="flex gap-2">
                  {chartTypes.map(t => (
                    <button
                      key={t.value}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-2 py-1 rounded-lg border text-sm
                        ${draftType === t.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold"
                          : "border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-800"
                        }
                      `}
                      onClick={() => {
                        setDraftType(t.value as WidgetType);
                        const newDraft = getDefaultChartSettings(t.value as WidgetType);
                        setDraft(newDraft);
                        setDirty(true);
                        setShowTypeChanger(false);
                        if (onLiveUpdate) onLiveUpdate({ ...newDraft, type: t.value as WidgetType });
                      }}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  className="text-xs text-gray-500 underline self-end mt-1"
                  onClick={() => setShowTypeChanger(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Settings Form */}
          <div className="flex-1 overflow-y-auto pb-2 pr-1">
            {renderPanel()}
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800"
              onClick={onClose}
            >Cancel</button>
            <button
              className={`
                px-4 py-2 rounded font-semibold transition
                ${dirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-400 cursor-not-allowed"}
              `}
              onClick={() => dirty && onSave({ ...draft, type: draftType })}
              disabled={!dirty}
            >Save</button>
          </div>
        </>
      )}
    </aside>
  );
}
