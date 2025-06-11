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
  mockTables: TableMeta[]
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
  // Only render if settings is a PieChartSettings
  if (settings.type !== "pie") return null;
  // settings is now PieChartSettings

  return (
    <>
      {/* Data Section */}
      <Section title="Data">
        <div className="mb-2">
          <label className="block text-xs mb-1">Table:</label>
          <select
            value={settings.table}
            onChange={e => updateSetting("table", e.target.value)}
            className="p-2 rounded border w-full"
          >
            {mockTables.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-xs mb-1">Category (X):</label>
          <select
            value={settings.xField}
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
            value={settings.yFields?.[0] ?? ""}
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

      {/* Appearance Section */}
      <Section title="Appearance">
        {(settings.yFields ?? []).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {(settings.yFields ?? []).map((field, idx) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-xs">{field}</span>
                <input
                  type="color"
                  value={settings.pieColors?.[idx] || defaultColors[idx % defaultColors.length]}
                  onChange={e => {
                    const colorArr = [...(settings.pieColors ?? defaultColors)];
                    colorArr[idx] = e.target.value;
                    updateSetting("pieColors", colorArr);
                  }}
                  className="w-6 h-6 border-0 rounded"
                  title={`Color for ${field}`}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Options Section */}
      <Section title="Options">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!settings.showLegend}
            onChange={e => updateSetting("showLegend", e.target.checked)}
          />
          Show Legend
        </label>
      </Section>
    </>
  );
}
