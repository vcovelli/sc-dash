import React from "react";
import { BarChartSettings, TableMeta } from "../../types";

const DEFAULT_COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{title}</div>
      <div className="bg-neutral-50 dark:bg-gray-800 rounded-xl p-3">{children}</div>
    </div>
  );
}

type Props = {
  settings: BarChartSettings;
  onChange: (next: BarChartSettings) => void;
  mockTables: TableMeta[]
  defaultColors?: string[];
  xColumns: { name: string; type: string }[];
  yColumns: { name: string; type: string }[];
  updateSetting: (key: keyof BarChartSettings, value: unknown) => void;
  toggleYField: (field: string) => void;
};

export default function BarChartSettingsPanel({
  settings,
  mockTables,
  defaultColors = DEFAULT_COLORS,
  xColumns,
  yColumns,
  updateSetting,
  //toggleYField
}: Props) {
  // --- Type Guard: Only render for bar charts! ---
  if (settings.type !== "bar") return null;
  // Now TypeScript knows settings is BarChartSettings

  // Find the X column meta (for axis min/max support)
  //const xCol = xColumns.find(col => col.name === settings.xField);
  //const showXMinMax = xCol && (xCol.type === "number" || xCol.type === "date");

  return (
    <>
      {/* Data Section */}
        <Section title="Data">
          <div className="mb-2">
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Table:</label>
            <select
              value={settings.table}
              onChange={e => updateSetting("table", e.target.value)}
              className="p-2 rounded border w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            >
              {mockTables.map(t => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">X Column:</label>
            <select
              value={settings.xField}
              onChange={e => updateSetting("xField", e.target.value)}
              className="p-2 rounded border w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            >
              {xColumns.map(col => (
                <option key={col.name} value={col.name}>{col.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Y Columns (Metrics):</label>
            {yColumns.length === 0 ? (
              <div className="text-xs text-red-600 dark:text-red-400 italic mt-1">
                No numeric columns available in this table.
              </div>
            ) : (
              yColumns.map(col => (
                <div key={col.name} className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    checked={settings.yFields.includes(col.name)}
                    onChange={() => {
                      const newY = settings.yFields.includes(col.name)
                        ? settings.yFields.filter(f => f !== col.name)
                        : [...settings.yFields, col.name];
                      updateSetting("yFields", newY);
                    }}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-100">{col.name}</span>
                </div>
              ))
            )}
          </div>
        </Section>

      {/* Appearance Section */}
      <Section title="Appearance">
        <div className="flex flex-wrap gap-3">
          {(settings.yFields ?? []).map((field, idx) => (
            <div key={field} className="flex items-center gap-2">
              <span className="text-xs">{field}</span>
              <input
                type="color"
                value={settings.barColors?.[idx] || defaultColors[idx % defaultColors.length]}
                onChange={e => {
                  const colorArr = [...(settings.barColors ?? defaultColors)];
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

      {/* Options Section */}
      <Section title="Options">
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!settings.showLegend}
              onChange={e => updateSetting("showLegend", e.target.checked)}
            />
            Show Legend
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={!!settings.stacked}
              onChange={e => updateSetting("stacked", e.target.checked)}
            />
            Stacked Bars
          </label>
        </div>
      </Section>
    </>
  );
}
