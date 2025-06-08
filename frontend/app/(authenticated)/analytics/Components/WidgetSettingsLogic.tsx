import { WidgetType } from "../types";

const TABLES = [
  { name: "orders", columns: ["status", "date", "revenue", "count"] },
  { name: "products", columns: ["category", "price", "units_sold"] },
  { name: "customers", columns: ["region", "signup_date", "lifetime_value"] },
];

const COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

export function renderSettingsByChartType(
  type: WidgetType,
  draft: any,
  updateSetting: (key: string, value: any) => void,
  toggleYField: (field: string) => void,
  tableName: string
) {
  const table = TABLES.find(t => t.name === tableName) || TABLES[0];

  switch (type) {
    case "bar":
    case "line":
      return (
        <>
          <div className="mb-3">
            <label className="font-semibold block mb-1">Table</label>
            <select
              value={draft.table}
              onChange={e => updateSetting("table", e.target.value)}
              className="mb-2 p-1 border rounded w-full"
            >
              {TABLES.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <label className="font-semibold block mb-1">X Column</label>
            <select
              value={draft.xField}
              onChange={e => updateSetting("xField", e.target.value)}
              className="mb-2 p-1 border rounded w-full"
            >
              {table.columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <label className="font-semibold block mb-1">Y Columns</label>
            {table.columns.map(col => (
              <label key={col} className="inline-flex items-center mr-3 mb-1">
                <input
                  type="checkbox"
                  checked={draft.yFields.includes(col)}
                  onChange={() => toggleYField(col)}
                  className="mr-1"
                />
                {col}
              </label>
            ))}
          </div>
          <div className="mb-3">
            <label className="font-semibold block mb-1">Colors</label>
            {draft.yFields.map((field: string, idx: number) => (
              <input
                key={field}
                type="color"
                value={draft.barColors?.[idx] || COLORS[idx % COLORS.length]}
                onChange={e => {
                  const colorArr = [...(draft.barColors || COLORS)];
                  colorArr[idx] = e.target.value;
                  updateSetting("barColors", colorArr);
                }}
                className="ml-2 w-6 h-6 p-0 border-0 rounded"
                title={`Color for ${field}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-6 mb-3">
            <label>
              <span className="font-semibold">Y Axis Scale:</span>
              <select
                value={draft.yScale || "linear"}
                onChange={e => updateSetting("yScale", e.target.value)}
                className="ml-2 p-1 border rounded"
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <label>
              <input
                type="checkbox"
                checked={!!draft.showLegend}
                onChange={e => updateSetting("showLegend", e.target.checked)}
                className="mr-1"
              />
              Show Legend
            </label>
            {type === "bar" && (
              <label>
                <input
                  type="checkbox"
                  checked={!!draft.stacked}
                  onChange={e => updateSetting("stacked", e.target.checked)}
                  className="mr-1"
                />
                Stacked Bars
              </label>
            )}
          </div>
        </>
      );
    case "pie":
      return (
        <>
          <div className="mb-3">
            <label className="font-semibold block mb-1">Table</label>
            <select
              value={draft.table}
              onChange={e => updateSetting("table", e.target.value)}
              className="mb-2 p-1 border rounded w-full"
            >
              {TABLES.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <label className="font-semibold block mb-1">Category (X)</label>
            <select
              value={draft.xField}
              onChange={e => updateSetting("xField", e.target.value)}
              className="mb-2 p-1 border rounded w-full"
            >
              {table.columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <label className="font-semibold block mb-1">Value (Y)</label>
            <select
              value={draft.yFields[0] || ""}
              onChange={e => updateSetting("yFields", [e.target.value])}
              className="mb-2 p-1 border rounded w-full"
            >
              {table.columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="font-semibold block mb-1">Color</label>
            <input
              type="color"
              value={draft.barColors?.[0] || COLORS[0]}
              onChange={e => updateSetting("barColors", [e.target.value])}
              className="ml-2 w-6 h-6 p-0 border-0 rounded"
              title="Pie color"
            />
          </div>
          <div className="flex items-center gap-4 mb-2">
            <label>
              <input
                type="checkbox"
                checked={!!draft.showLegend}
                onChange={e => updateSetting("showLegend", e.target.checked)}
                className="mr-1"
              />
              Show Legend
            </label>
          </div>
        </>
      );
    case "table":
      return (
        <>
          <div className="mb-3">
            <label className="font-semibold block mb-1">Table</label>
            <select
              value={draft.table}
              onChange={e => updateSetting("table", e.target.value)}
              className="mb-2 p-1 border rounded w-full"
            >
              {TABLES.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <label className="font-semibold block mb-1">Columns to Show</label>
            {table.columns.map(col => (
              <label key={col} className="inline-flex items-center mr-3 mb-1">
                <input
                  type="checkbox"
                  checked={draft.yFields.includes(col)}
                  onChange={() => toggleYField(col)}
                  className="mr-1"
                />
                {col}
              </label>
            ))}
          </div>
        </>
      );
    default:
      return null;
  }
}
