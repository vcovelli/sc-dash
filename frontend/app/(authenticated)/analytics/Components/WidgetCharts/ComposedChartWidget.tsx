import React from "react";
import {
  ResponsiveContainer,
  ComposedChart as RComposedChart,
  Bar,
  Line,
  Area,
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
  { name: "Page A", uv: 590, pv: 800, amt: 1400 },
  { name: "Page B", uv: 868, pv: 967, amt: 1506 },
  { name: "Page C", uv: 1397, pv: 1098, amt: 989 },
  { name: "Page D", uv: 1480, pv: 1200, amt: 1228 },
  { name: "Page E", uv: 1520, pv: 1108, amt: 1100 },
  { name: "Page F", uv: 1400, pv: 680, amt: 1700 },
];

// ---- Types ----
type ComposedChartConfig = {
  xField: string;
  yFields: string[];
  chartTypes: ("bar" | "line" | "area")[];
  colors?: string[];
  showLegend?: boolean;
  yScale?: "linear" | "log" | "auto";
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
};

type DataRow = Record<string, unknown>;

export function ComposedChartWidget({
  config,
  data,
}: {
  config: ComposedChartConfig;
  data?: DataRow[];
}) {
  const composedData = data || SAMPLE_DATA;

  // Guard: No data, or not enough fields specified
  if (
    !composedData ||
    composedData.length === 0 ||
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

  // Ensure chartTypes array matches yFields length
  const chartTypes = config.chartTypes || [];
  const defaultType = "bar";

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RComposedChart data={composedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.xField || "name"} />
          <YAxis
            scale={config.yScale || "linear"}
            domain={yDomain}
            allowDataOverflow
          />
          <Tooltip />
          {config.showLegend !== false && <Legend />}
          
          {config.yFields.map((yField, idx) => {
            const chartType = chartTypes[idx] || defaultType;
            const color = (config.colors && config.colors[idx]) || COLORS[idx % COLORS.length];
            
            switch (chartType) {
              case "bar":
                return (
                  <Bar
                    key={yField}
                    dataKey={yField}
                    fill={color}
                    name={yField}
                  />
                );
              case "line":
                return (
                  <Line
                    key={yField}
                    type="monotone"
                    dataKey={yField}
                    stroke={color}
                    name={yField}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  />
                );
              case "area":
                return (
                  <Area
                    key={yField}
                    type="monotone"
                    dataKey={yField}
                    fill={color}
                    stroke={color}
                    name={yField}
                    fillOpacity={0.6}
                  />
                );
              default:
                return (
                  <Bar
                    key={yField}
                    dataKey={yField}
                    fill={color}
                    name={yField}
                  />
                );
            }
          })}
        </RComposedChart>
      </ResponsiveContainer>
    </div>
  );
}