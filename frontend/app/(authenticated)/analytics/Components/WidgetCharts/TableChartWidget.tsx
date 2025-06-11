// components/WidgetCharts/TableChartWidget.tsx

type TableChartConfig = {
  xField: string;
  yFields: string[];
};

type DataRow = Record<string, unknown>;

export function TableChartWidget({
  config,
  data,
}: {
  config: TableChartConfig;
  data?: DataRow[];
}) {
  const tableData = data || [
    { name: "A", count: 400 },
    { name: "B", count: 300 },
    { name: "C", count: 200 },
    { name: "D", count: 278 },
    { name: "E", count: 189 },
  ];
  const columns = [config.xField || "name", ...(config.yFields || ["count"])];
  return (
    <div className="w-full h-full flex flex-col min-w-0 min-h-0 overflow-x-auto">
      <div className="flex-1 min-w-0 min-h-0">
        <table className="w-full min-w-max text-left">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="p-2 font-semibold bg-gray-100 dark:bg-gray-800">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                {columns.map((col) => (
                  <td key={col} className="p-2">{String(row[col] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
