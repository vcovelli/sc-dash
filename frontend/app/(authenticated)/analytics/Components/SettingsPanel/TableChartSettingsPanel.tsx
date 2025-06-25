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
  mockTables: TableMeta[];
  xColumns: { name: string; type: string }[];
  yColumns: { name: string; type: string }[];
  updateSetting: (key: keyof TableChartSettings, value: unknown) => void;
};

export default function TableChartSettingsPanel({
  settings,
  mockTables,
  xColumns,
  yColumns,
  updateSetting,
}: Props) {
  return (
    <>
      <Section title="Data">
        {/* Table Selector */}
        <div className="mb-3">
          <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Table:</label>
          <select
            value={settings.table}
            onChange={(e) => updateSetting("table", e.target.value)}
            className="p-2 rounded border w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          >
            {mockTables.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* X Field Selector */}
        <div className="mb-3">
          <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">X Column:</label>
          <select
            value={settings.xField}
            onChange={(e) => updateSetting("xField", e.target.value)}
            className="p-2 rounded border w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          >
            {xColumns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Y Fields Checkboxes */}
        <div>
          <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">
            Y Columns (Metrics):
          </label>
          {yColumns.length === 0 ? (
            <div className="text-xs text-red-600 dark:text-red-400 italic mt-1">
              No numeric columns available in this table.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {yColumns.map((col) => {
                const selected = (settings.yFields ?? []).includes(col.name);
                return (
                  <label
                    key={col.name}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border cursor-pointer 
                                text-sm text-gray-800 dark:text-gray-100 
                                bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const next = selected
                          ? (settings.yFields ?? []).filter((f) => f !== col.name)
                          : [...(settings.yFields ?? []), col.name];
                        updateSetting("yFields", next);
                      }}
                      className="accent-blue-600"
                    />
                    {col.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
