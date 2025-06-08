import { useState, useEffect } from "react";
import { WidgetConfig, WidgetType } from "../types";
import { BarChart2, LineChart, PieChart, Table } from "lucide-react";

// --- MOCK DATA (replace with real schema from API later) ---
const MOCK_TABLES = [
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

const DEFAULT_COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

const NAVBAR_HEIGHT = 72;

const chartTypes = [
  { value: "bar", label: "Bar", icon: <BarChart2 className="w-5 h-5" /> },
  { value: "line", label: "Line", icon: <LineChart className="w-5 h-5" /> },
  { value: "pie", label: "Pie", icon: <PieChart className="w-5 h-5" /> },
  { value: "table", label: "Table", icon: <Table className="w-5 h-5" /> },
];

// --- Utility: Get defaults for each chart type ---
function getDefaultChartSettings(type: WidgetType) {
  switch (type) {
    case "bar":
      return { table: "orders", xField: "status", yFields: ["count"], showLegend: true };
    case "line":
      return { table: "orders", xField: "date", yFields: ["revenue"], showLegend: true };
    case "pie":
      return { table: "orders", xField: "status", yFields: ["count"], showLegend: true };
    case "table":
      return { table: "orders", xField: "status", yFields: ["count"] };
    default:
      return {};
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
  widget?: WidgetConfig;
  open: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  onExitFocus?: () => void;
  onLiveUpdate?: (draft: any) => void;
}) {
  const [draft, setDraft] = useState<any>({
    ...(widget?.settings ?? {}),
    yFields: widget?.settings?.yFields ?? [],
    barColors: widget?.settings?.barColors ?? [],
  });
  const [draftType, setDraftType] = useState<WidgetType>(widget?.type ?? "bar");
  const [dirty, setDirty] = useState(false);
  const [showTypeChanger, setShowTypeChanger] = useState(false);

  // --- Get current table meta (typed columns) ---
  const xTable = MOCK_TABLES.find(t => t.name === draft.table) || MOCK_TABLES[0];
  const xColumns = xTable.columns.filter(
    col => col.type === "string" || col.type === "category"
  );
  const yColumns = xTable.columns.filter(col => col.type === "number");

  useEffect(() => {
    setDraft({
      ...(widget?.settings ?? {}),
      yFields: widget?.settings?.yFields ?? [],
      barColors: widget?.settings?.barColors ?? [],
    });
    setDraftType(widget?.type ?? "bar");
    setDirty(false);
    setShowTypeChanger(false);
  }, [widget?.id]);

  const updateSetting = (key: string, value: any) => {
    setDraft(d => {
      const updated = { ...d, [key]: value };
      setDirty(true);
      if (onLiveUpdate) onLiveUpdate({ ...updated, type: draftType });
      return updated;
    });
  };

  const toggleYField = (field: string) => {
    setDraft(d => {
      const next = (d.yFields ?? []).includes(field)
        ? (d.yFields ?? []).filter((f: string) => f !== field)
        : [...(d.yFields ?? []), field];
      const updated = { ...d, yFields: next };
      setDirty(true);
      if (onLiveUpdate) onLiveUpdate({ ...updated, type: draftType });
      return updated;
    });
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
            {renderSettingsByChartType(
              draftType,
              draft,
              updateSetting,
              toggleYField,
              xTable,
              xColumns,
              yColumns
            )}
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

// --- Section Divider ---
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{title}</div>
      <div className="bg-neutral-50 dark:bg-gray-800 rounded-xl p-3">{children}</div>
    </div>
  );
}

// --- Main Chart Type Renderer ---
function renderSettingsByChartType(
  type: WidgetType,
  draft: any,
  updateSetting: (key: string, value: any) => void,
  toggleYField: (field: string) => void,
  xTable: any,
  xColumns: any[],
  yColumns: any[]
) {
  // Find the X column meta (to check if numeric/date for axis min/max support)
  const xCol = xTable.columns.find((col: any) => col.name === draft.xField);

  // Only show X Axis min/max for numeric/date X columns
  const showXMinMax = xCol && (xCol.type === "number" || xCol.type === "date");

  switch (type) {
    case "bar":
    case "line":
      return (
        <>
          <Section title="Data">
            <div className="mb-2">
              <label className="block text-xs mb-1">Table:</label>
              <select
                value={draft.table}
                onChange={e => updateSetting("table", e.target.value)}
                className="p-2 rounded border w-full"
              >
                {MOCK_TABLES.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">X Column:</label>
              <select
                value={draft.xField}
                onChange={e => updateSetting("xField", e.target.value)}
                className="p-2 rounded border w-full"
              >
                {xColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Y Columns (Metrics):</label>
              {yColumns.length === 0 ? (
                <div className="text-xs text-red-500 italic mt-1">
                  No numeric columns available in this table.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {yColumns.map(col => (
                    <label
                      key={col.name}
                      className="inline-flex items-center bg-white dark:bg-gray-900 rounded px-2 py-1 border"
                    >
                      <input
                        type="checkbox"
                        checked={(draft.yFields ?? []).includes(col.name)}
                        onChange={() => toggleYField(col.name)}
                        className="mr-1"
                      />
                      {col.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Section>
          <Section title="Appearance">
            <div className="flex flex-wrap gap-3">
              {(draft.yFields ?? []).map((field: string, idx: number) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs">{field}</span>
                  <input
                    type="color"
                    value={draft.barColors?.[idx] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                    onChange={e => {
                      const colorArr = [...(draft.barColors || DEFAULT_COLORS)];
                      colorArr[idx] = e.target.value;
                      updateSetting("barColors", colorArr);
                    }}
                    className="w-6 h-6 border-0 rounded"
                    title={`Color for ${field}`}
                  />
                </div>
              ))}
            </div>
          </Section>
          <Section title="Options">
            <div className="flex gap-4 items-center flex-wrap">
              <span className="font-semibold">Y Axis:</span>
              <select
                value={draft.yScale || "linear"}
                onChange={e => updateSetting("yScale", e.target.value)}
                className="p-1 border rounded"
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="auto">Auto</option>
              </select>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!draft.showLegend}
                  onChange={e => updateSetting("showLegend", e.target.checked)}
                />
                Show Legend
              </label>
              {type === "bar" && (
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={!!draft.stacked}
                    onChange={e => updateSetting("stacked", e.target.checked)}
                  />
                  Stacked Bars
                </label>
              )}
            </div>
            {/* Y Axis min/max */}
            <div className="flex gap-4 mt-3 flex-wrap items-center">
              <label className="flex flex-col text-xs font-medium">
                Y Min
                <input
                  type="number"
                  className="mt-1 p-1 border rounded w-20"
                  placeholder="auto"
                  value={draft.yMin ?? ""}
                  onChange={e => updateSetting("yMin", e.target.value === "" ? undefined : Number(e.target.value))}
                  min={-1000000}
                  max={1000000}
                />
              </label>
              <label className="flex flex-col text-xs font-medium">
                Y Max
                <input
                  type="number"
                  className="mt-1 p-1 border rounded w-20"
                  placeholder="auto"
                  value={draft.yMax ?? ""}
                  onChange={e => updateSetting("yMax", e.target.value === "" ? undefined : Number(e.target.value))}
                  min={-1000000}
                  max={1000000}
                />
              </label>
              {/* X Axis min/max if numeric/date */}
              {showXMinMax && (
                <>
                  <label className="flex flex-col text-xs font-medium">
                    X Min
                    <input
                      type={xCol.type === "date" ? "date" : "number"}
                      className="mt-1 p-1 border rounded w-20"
                      placeholder="auto"
                      value={draft.xMin ?? ""}
                      onChange={e => updateSetting("xMin", e.target.value === "" ? undefined :
                        xCol.type === "date" ? e.target.value : Number(e.target.value)
                      )}
                    />
                  </label>
                  <label className="flex flex-col text-xs font-medium">
                    X Max
                    <input
                      type={xCol.type === "date" ? "date" : "number"}
                      className="mt-1 p-1 border rounded w-20"
                      placeholder="auto"
                      value={draft.xMax ?? ""}
                      onChange={e => updateSetting("xMax", e.target.value === "" ? undefined :
                        xCol.type === "date" ? e.target.value : Number(e.target.value)
                      )}
                    />
                  </label>
                </>
              )}
            </div>
          </Section>
        </>
      );
    case "pie":
      // Pie chart: X = string/category, Y = single numeric
      return (
        <>
          <Section title="Data">
            <div className="mb-2">
              <label className="block text-xs mb-1">Table:</label>
              <select
                value={draft.table}
                onChange={e => updateSetting("table", e.target.value)}
                className="p-2 rounded border w-full"
              >
                {MOCK_TABLES.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">Category (X):</label>
              <select
                value={draft.xField}
                onChange={e => updateSetting("xField", e.target.value)}
                className="p-2 rounded border w-full"
              >
                {xColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Value (Y):</label>
              <select
                value={(draft.yFields ?? [])[0] || ""}
                onChange={e => updateSetting("yFields", [e.target.value])}
                className="p-2 rounded border w-full"
              >
                <option value="">Select metric...</option>
                {yColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
          </Section>
          <Section title="Appearance">
            <div className="flex flex-wrap gap-3">
              {(draft.yFields ?? []).map((field: string, idx: number) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="text-xs">{field}</span>
                  <input
                    type="color"
                    value={draft.barColors?.[idx] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                    onChange={e => {
                      const colorArr = [...(draft.barColors || DEFAULT_COLORS)];
                      colorArr[idx] = e.target.value;
                      updateSetting("barColors", colorArr);
                    }}
                    className="w-6 h-6 border-0 rounded"
                    title={`Color for ${field}`}
                  />
                </div>
              ))}
            </div>
          </Section>
          <Section title="Options">
            <div className="flex gap-4 items-center flex-wrap">
              <span className="font-semibold">Y Axis:</span>
              <select
                value={draft.yScale || "linear"}
                onChange={e => updateSetting("yScale", e.target.value)}
                className="p-1 border rounded"
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="auto">Auto</option>
              </select>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={!!draft.showLegend}
                  onChange={e => updateSetting("showLegend", e.target.checked)}
                />
                Show Legend
              </label>
            </div>
            {/* Y Axis min/max */}
            <div className="flex gap-4 mt-3 flex-wrap items-center">
              <label className="flex flex-col text-xs font-medium">
                Y Min
                <input
                  type="number"
                  className="mt-1 p-1 border rounded w-20"
                  placeholder="auto"
                  value={draft.yMin ?? ""}
                  onChange={e => updateSetting("yMin", e.target.value === "" ? undefined : Number(e.target.value))}
                  min={-1000000}
                  max={1000000}
                />
              </label>
              <label className="flex flex-col text-xs font-medium">
                Y Max
                <input
                  type="number"
                  className="mt-1 p-1 border rounded w-20"
                  placeholder="auto"
                  value={draft.yMax ?? ""}
                  onChange={e => updateSetting("yMax", e.target.value === "" ? undefined : Number(e.target.value))}
                  min={-1000000}
                  max={1000000}
                />
              </label>
            </div>
          </Section>
        </>
      );
    default:
      return null;
  }
}
