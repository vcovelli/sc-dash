import React from "react";
import {
  ResponsiveContainer,
  AreaChart as RAreaChart,
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
  { name: "Jan", revenue: 2400, profit: 1200 },
  { name: "Feb", revenue: 2210, profit: 1100 },
  { name: "Mar", revenue: 2290, profit: 1380 },
  { name: "Apr", revenue: 2000, profit: 980 },
  { name: "May", revenue: 2181, profit: 1210 },
  { name: "Jun", revenue: 2500, profit: 1350 },
];

// ---- Types ----
type AreaChartConfig = {
  xField: string;
  yFields: string[];
  areaColors?: string[];
  showLegend?: boolean;
  stacked?: boolean;
  yScale?: "linear" | "log" | "auto";
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  fillOpacity?: number;
};

type DataRow = Record<string, unknown>;

export function AreaChartWidget({
  config,
  data,
}: {
  config: AreaChartConfig;
  data?: DataRow[];
}) {
  const areaData = data || SAMPLE_DATA;

  // Guard: No data, or not enough fields specified
  if (
    !areaData ||
    areaData.length === 0 ||
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

  const fillOpacity = config.fillOpacity ?? 0.6;

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RAreaChart data={areaData}>
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
          {(config.yFields || ["revenue"]).map((y, idx) => (
            <Area
              key={y}
              type="monotone"
              dataKey={y}
              stackId={config.stacked ? "1" : undefined}
              stroke={
                (config.areaColors && config.areaColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              fill={
                (config.areaColors && config.areaColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              fillOpacity={fillOpacity}
            />
          ))}
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
}