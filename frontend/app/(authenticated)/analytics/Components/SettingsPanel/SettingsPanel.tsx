import React, { useState, useEffect } from "react";
import {
  TableMeta, WidgetConfig, WidgetType, AllWidgetSettings,
  BarChartSettings, LineChartSettings, PieChartSettings, TableChartSettings
} from "../../types";
import BarChartSettingsPanel from "./BarChartSettingsPanel";
import LineChartSettingsPanel from "./LineChartSettingsPanel";
import PieChartSettingsPanel from "./PieChartSettingsPanel";
import TableChartSettingsPanel from "./TableChartSettingsPanel";
import { BarChart2, LineChart, PieChart, Table } from "lucide-react";
import { getAvailableTables } from "@/lib/analyticsAPI";

// --- MOCK DATA (fallback) ---
const MOCK_TABLES: TableMeta[] = [
  { name: "orders", columns: [
    { name: "status", type: "string" }, { name: "date", type: "date" },
    { name: "revenue", type: "number" }, { name: "count", type: "number" }
  ] },
  { name: "products", columns: [
    { name: "category", type: "string" }, { name: "price", type: "number" },
    { name: "units_sold", type: "number" }
  ] },
  { name: "customers", columns: [
    { name: "region", type: "string" }, { name: "signup_date", type: "date" },
    { name: "lifetime_value", type: "number" }
  ] },
];

const chartTypes = [
  { value: "bar", label: "Bar", icon: <BarChart2 className="w-5 h-5" /> },
  { value: "line", label: "Line", icon: <LineChart className="w-5 h-5" /> },
  { value: "pie", label: "Pie", icon: <PieChart className="w-5 h-5" /> },
  { value: "table", label: "Table", icon: <Table className="w-5 h-5" /> },
];

// Convert backend schema format to our TableMeta format
const convertSchemaToTableMeta = (schemas: { table_name: string; columns: { accessorKey?: string; header?: string; type: string }[] }[]): TableMeta[] => {
  return schemas.map(schema => ({
    name: schema.table_name,
    columns: schema.columns.map((col: { accessorKey?: string; header?: string; type: string }) => ({
      name: col.accessorKey || col.header || 'unknown',
      type: col.type === 'number' ? 'number' : 
            col.type === 'date' ? 'date' : 'string'
    }))
  }));
};

function getDefaultChartSettings(type: WidgetType, availableTables: TableMeta[]): AllWidgetSettings {
  const defaultTable = availableTables.length > 0 ? availableTables[0].name : "orders";
  const defaultXField = availableTables.length > 0 ? 
    (availableTables[0].columns.find(c => c.type === 'string')?.name || 'status') : 'status';
  const defaultYField = availableTables.length > 0 ? 
    (availableTables[0].columns.find(c => c.type === 'number')?.name || 'count') : 'count';

  switch (type) {
    case "bar":
      return { type: "bar", table: defaultTable, xField: defaultXField, yFields: [defaultYField], showLegend: true };
    case "line":
      return { type: "line", table: defaultTable, xField: defaultXField, yFields: [defaultYField], showLegend: true };
    case "pie":
      return { type: "pie", table: defaultTable, xField: defaultXField, yFields: [defaultYField], showLegend: true };
    case "table":
      return { type: "table", table: defaultTable, xField: defaultXField, yFields: [defaultYField] };
    default:
      return { type: "table", table: defaultTable, xField: defaultXField, yFields: [] };
  }
}

export default function SettingsPanel({
  widget,
  open,
  onClose,
  onSave,
  onExitFocus,
  onLiveUpdate,
  //isMobile = false,
}: {
  widget?: WidgetConfig<AllWidgetSettings>;
  open: boolean;
  onClose: () => void;
  onSave: (settings: AllWidgetSettings) => void;
  onExitFocus?: () => void;
  onLiveUpdate?: (draft: AllWidgetSettings) => void;
  //isMobile?: boolean;
}) {
  const [availableTables, setAvailableTables] = useState<TableMeta[]>(MOCK_TABLES);
  const [loadingTables, setLoadingTables] = useState(false);
  const [draft, setDraft] = useState<AllWidgetSettings>(
    () => widget?.settings ?? getDefaultChartSettings(widget?.type ?? "bar", MOCK_TABLES)
  );
  const [draftType, setDraftType] = useState<WidgetType>(widget?.type ?? "bar");
  const [dirty, setDirty] = useState(false);
  const [showTypeChanger, setShowTypeChanger] = useState(false);

  // Load available tables from API
  useEffect(() => {
    const loadTables = async () => {
      setLoadingTables(true);
      try {
        const schemas = await getAvailableTables();
        if (schemas && schemas.length > 0) {
          const tables = convertSchemaToTableMeta(schemas);
          setAvailableTables(tables);
        } else {
          // If no real tables, use mock data
          setAvailableTables(MOCK_TABLES);
        }
      } catch (error) {
        console.error("Failed to load tables:", error);
        // Fallback to mock data on error
        setAvailableTables(MOCK_TABLES);
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, []);

  // Table helpers
  const xTable = availableTables.find(t => t.name === draft.table) || availableTables[0];
  const xColumns = xTable?.columns.filter(col => col.type === "string" || col.type === "category") || [];
  const yColumns = xTable?.columns.filter(col => col.type === "number") || [];

  useEffect(() => {
    const defaults = getDefaultChartSettings(widget?.type ?? "bar", availableTables);
    const incoming = widget?.settings ?? {};
    const merged: AllWidgetSettings = { ...defaults, ...incoming };
    if (merged.type === "bar" && "barColors" in incoming) (merged as BarChartSettings).barColors = (incoming as BarChartSettings).barColors;
    if (merged.type === "line" && "lineColors" in incoming) (merged as LineChartSettings).lineColors = (incoming as LineChartSettings).lineColors;
    if (merged.type === "pie" && "pieColors" in incoming) (merged as PieChartSettings).pieColors = (incoming as PieChartSettings).pieColors;
    merged.yFields = "yFields" in incoming && Array.isArray(incoming.yFields) ? incoming.yFields : defaults.yFields;
    setDraft(merged);
    setDraftType(widget?.type ?? "bar");
    setDirty(false);
    setShowTypeChanger(false);
  }, [widget?.id, widget?.settings, widget?.type, availableTables]);

  const toggleYField = (field: string) => {
    setDraft(d => {
      const current = d.yFields ?? [];
      const next = current.includes(field)
        ? current.filter((f: string) => f !== field)
        : [...current, field];
      const updated = { ...d, yFields: next };
      setDirty(true);
      if (onLiveUpdate) onLiveUpdate({ ...updated, type: draftType } as AllWidgetSettings);
      return updated;
    });
  };

  const renderPanel = () => {
    if (loadingTables) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading tables...</div>
        </div>
      );
    }

    switch (draftType) {
      case "bar":
        return (
          <BarChartSettingsPanel
            settings={draft as BarChartSettings}
            onChange={next => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "bar" });
            }}
            mockTables={availableTables}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={(key, value) => {
              setDraft((d) => ({ ...d, [key]: value }) as BarChartSettings);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...draft, [key]: value, type: draftType } as AllWidgetSettings);
            }}
            toggleYField={toggleYField}
          />
        );
      case "line":
        return (
          <LineChartSettingsPanel
            settings={draft as LineChartSettings}
            onChange={next => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "line" });
            }}
            mockTables={availableTables}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={(key, value) => {
              setDraft((d) => ({ ...d, [key]: value }) as LineChartSettings);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...draft, [key]: value, type: draftType } as AllWidgetSettings);
            }}
            toggleYField={toggleYField}
          />
        );
      case "pie":
        return (
          <PieChartSettingsPanel
            settings={draft as PieChartSettings}
            onChange={next => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "pie" });
            }}
            mockTables={availableTables}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={(key, value) => {
              setDraft((d) => ({ ...d, [key]: value }) as PieChartSettings);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...draft, [key]: value, type: draftType } as AllWidgetSettings);
            }}
          />
        );
      case "table":
        return (
          <TableChartSettingsPanel
            settings={draft as TableChartSettings}
            onChange={next => {
              setDraft(next);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...next, type: "table" });
            }}
            mockTables={availableTables}
            xColumns={xColumns}
            yColumns={yColumns}
            updateSetting={(key, value) => {
              setDraft((d) => ({ ...d, [key]: value }) as TableChartSettings);
              setDirty(true);
              if (onLiveUpdate) onLiveUpdate({ ...draft, [key]: value, type: draftType } as AllWidgetSettings);
            }}
          />
        );
      default:
        return null;
    }
  };

  // This is the SIMPLEST sidebar panel possible, scrolls as a normal div
  if (!open) return null;

  return (
    <aside
      className="
        flex flex-col h-full w-full max-w-full
        bg-white dark:bg-gray-900 shadow-xl border-l border-neutral-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
      "
      style={{ minWidth: 320, maxWidth: 420, overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-6 pt-6">
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

      {/* Chart Type */}
      <div className="mb-4 px-6">
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
                    const newDraft = getDefaultChartSettings(t.value as WidgetType, availableTables);
                    setDraft(newDraft);
                    setDirty(true);
                    setShowTypeChanger(false);
                    if (onLiveUpdate) onLiveUpdate({ ...newDraft, type: t.value as WidgetType } as AllWidgetSettings);
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

      {/* SCROLLABLE SETTINGS AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto px-6 pb-4">
        {renderPanel()}
      </div>

      {/* Action Buttons - sticky at bottom */}
      <div className="flex justify-end gap-3 mt-4 px-6 pb-6 shrink-0">
        <button
          className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800"
          onClick={onClose}
        >Cancel</button>
        <button
          className={`
            px-4 py-2 rounded font-semibold transition
            ${dirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-400 cursor-not-allowed"}
          `}
          onClick={() => dirty && onSave({ ...draft, type: draftType } as AllWidgetSettings)}
          disabled={!dirty}
        >Save</button>
      </div>
    </aside>
  );
}
