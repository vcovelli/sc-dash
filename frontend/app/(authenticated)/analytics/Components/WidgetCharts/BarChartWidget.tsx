import {
  ResponsiveContainer,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

const SAMPLE_DATA = [
  { name: "A", count: 400, revenue: 2400 },
  { name: "B", count: 300, revenue: 2210 },
  { name: "C", count: 200, revenue: 2290 },
  { name: "D", count: 278, revenue: 2000 },
  { name: "E", count: 189, revenue: 2181 },
];

// ---- Types ----
type BarChartConfig = {
  xField: string;
  yFields: string[];
  barColors?: string[];
  showLegend?: boolean;
  stacked?: boolean;
  yScale?: "linear" | "log" | "auto";
  yMin?: number;
  yMax?: number;
  xMin?: number | string; // for numeric/date x-axis, else ignored
  xMax?: number | string;
};

type DataRow = Record<string, unknown>;

export function BarChartWidget({
  config,
  data,
}: {
  config: BarChartConfig;
  data?: DataRow[];
}) {
  const barData = data || SAMPLE_DATA;

  // Guard: No data, or not enough fields specified
  if (
    !barData ||
    barData.length === 0 ||
    !config.xField ||
    !config.yFields?.length
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400">
        No data to display.
      </div>
    );
  }

  // --- Y Axis domain setup (auto unless set) ---
  const yDomain: [number | "auto", number | "auto"] = [
    typeof config.yMin === "number" ? config.yMin : "auto",
    typeof config.yMax === "number" ? config.yMax : "auto",
  ];

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={config.xField || "name"}
          />
          <YAxis
            scale={config.yScale || "linear"}
            domain={yDomain}
            allowDataOverflow
          />
          <Tooltip />
          {config.showLegend !== false && <Legend />}
          {(config.yFields || ["count"]).map((y, idx) => (
            <Bar
              key={y}
              dataKey={y}
              fill={
                (config.barColors && config.barColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              stackId={config.stacked ? "a" : undefined}
            />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
