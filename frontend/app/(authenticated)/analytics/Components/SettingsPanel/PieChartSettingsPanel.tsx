import React from "react";
import { PieChartSettings, TableMeta } from "../../types";

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
  settings: PieChartSettings;
  onChange: (next: PieChartSettings) => void;
  mockTables: TableMeta[];
  defaultColors?: string[];
  xColumns: { name: string; type: string }[];
  yColumns: { name: string; type: string }[];
  updateSetting: (key: keyof PieChartSettings, value: unknown) => void;
};

export default function PieChartSettingsPanel({
  settings,
  mockTables,
  defaultColors = DEFAULT_COLORS,
  xColumns,
  yColumns,
  updateSetting
}: Props) {
  if (settings.type !== "pie") return null;

  return (
    <>
      {/* Data Section */}
      <Section title="Data">
        <div className="mb-3">
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
        <div className="mb-3">
          <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Category (X):</label>
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
        <div className="mb-1">
          <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Value (Y):</label>
          <select
            value={settings.yFields?.[0] ?? ""}
            onChange={e => updateSetting("yFields", [e.target.value])}
            className="p-2 rounded border w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select metric...</option>
            {yColumns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* Appearance Section */}
      <Section title="Appearance">
        {(settings.yFields ?? []).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {(settings.yFields ?? []).map((field, idx) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-xs text-gray-700 dark:text-gray-300">{field}</span>
                <input
                  type="color"
                  value={settings.pieColors?.[idx] || defaultColors[idx % defaultColors.length]}
                  onChange={e => {
                    const colorArr = [...(settings.pieColors ?? defaultColors)];
                    colorArr[idx] = e.target.value;
                    updateSetting("pieColors", colorArr);
                  }}
                  className="w-6 h-6 border-0 rounded cursor-pointer"
                  title={`Color for ${field}`}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Options Section */}
      <Section title="Options">
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={!!settings.showLegend}
            onChange={e => updateSetting("showLegend", e.target.checked)}
            className="accent-blue-600"
          />
          Show Legend
        </label>
      </Section>
    </>
  );
}
