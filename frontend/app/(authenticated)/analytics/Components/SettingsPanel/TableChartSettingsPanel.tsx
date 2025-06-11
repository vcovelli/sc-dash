import React from "react";
import { TableChartSettings, TableMeta } from "../../types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{title}</div>
      <div className="bg-neutral-50 dark:bg-gray-800 rounded-xl p-3">{children}</div>
    </div>
  );
}

type Props = {
  settings: TableChartSettings;
  onChange: (next: TableChartSettings) => void;
  mockTables: TableMeta[]
  xColumns: { name: string; type: string }[];
  yColumns: { name: string; type: string }[];
  updateSetting: (key: keyof TableChartSettings, value: unknown) => void;
};

export default function TableChartSettingsPanel({
  settings,
  mockTables,
  xColumns,
  yColumns,
  updateSetting
}: Props) {
  return (
    <>
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
          <label className="block text-xs mb-1">X Column:</label>
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
                    checked={(settings.yFields ?? []).includes(col.name)}
                    onChange={() => {
                      const next = (settings.yFields ?? []).includes(col.name)
                        ? (settings.yFields ?? []).filter((f: string) => f !== col.name)
                        : [...(settings.yFields ?? []), col.name];
                      updateSetting("yFields", next);
                    }}
                    className="mr-1"
                  />
                  {col.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </Section>
      {/* You can add more "Options" sections here if you want further configuration */}
    </>
  );
}
