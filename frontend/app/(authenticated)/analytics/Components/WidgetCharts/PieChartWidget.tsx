import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

const SAMPLE_DATA = [
  { name: "A", count: 400 },
  { name: "B", count: 300 },
  { name: "C", count: 200 },
  { name: "D", count: 278 },
  { name: "E", count: 189 },
];

type PieChartConfig = {
  xField: string;
  yFields: string[];
  showLegend?: boolean;
};

type DataRow = Record<string, unknown>;

// Aggregate data for pie charts
const aggregateDataForPie = (data: DataRow[], xField: string, yField: string) => {
  const aggregated: Record<string, number> = {};
  
  data.forEach(row => {
    const key = String(row[xField] || 'Unknown');
    const value = Number(row[yField]) || 1;
    aggregated[key] = (aggregated[key] || 0) + value;
  });
  
  return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
};

export function PieChartWidget({
  config,
  data,
}: {
  config: PieChartConfig;
  data?: DataRow[];
}) {
  const rawData = data || SAMPLE_DATA;
  const valueKey = (config.yFields && config.yFields[0]) || "count";
  const nameKey = config.xField || "name";

  // For pie charts, we need to aggregate data by the name field
  let pieData = rawData;
  
  // If we have raw data with the expected fields, aggregate it
  if (
    rawData.length > 0 &&
    config.xField &&
    Object.prototype.hasOwnProperty.call(rawData[0], config.xField)
  ) {
    pieData = aggregateDataForPie(rawData as DataRow[], nameKey, valueKey);
  }

  if (!pieData || pieData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400">
        No data to display.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"           // Move up a bit to make space for legend
            outerRadius="70%"  // Use % to be responsive!
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Count']} />
          {config.showLegend !== false && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{
                paddingTop: 8,
                fontSize: 14,
                lineHeight: "22px",
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
