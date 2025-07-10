import React from "react";
import {
  ResponsiveContainer,
  ScatterChart as RScatterChart,
  Scatter,
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
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

// ---- Types ----
type ScatterChartConfig = {
  xField: string;
  yFields: string[];
  scatterColors?: string[];
  showLegend?: boolean;
  yScale?: "linear" | "log" | "auto";
  xScale?: "linear" | "log" | "auto";
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  dotSize?: number;
};

type DataRow = Record<string, unknown>;

export function ScatterChartWidget({
  config,
  data,
}: {
  config: ScatterChartConfig;
  data?: DataRow[];
}) {
  const scatterData = data || SAMPLE_DATA;

  // Guard: No data, or not enough fields specified
  if (
    !scatterData ||
    scatterData.length === 0 ||
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

  // --- X Axis domain setup (auto unless set) ---
  const xDomain: [number | "auto", number | "auto"] = [
    typeof config.xMin === "number" ? config.xMin : "auto",
    typeof config.xMax === "number" ? config.xMax : "auto",
  ];

  // Transform data for scatter chart (needs specific format)
  const transformedData = scatterData.map(row => {
    const rowData = row as Record<string, unknown>;
    const transformed: Record<string, unknown> = {
      x: rowData[config.xField] || 0,
    };
    
    config.yFields.forEach(yField => {
      transformed[yField] = rowData[yField] || 0;
    });
    
    return transformed;
  });

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RScatterChart data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={config.xField}
            scale={config.xScale || "linear"}
            domain={xDomain}
          />
          <YAxis
            type="number"
            dataKey={config.yFields[0]}
            name={config.yFields[0]}
            scale={config.yScale || "linear"}
            domain={yDomain}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {config.showLegend !== false && <Legend />}
          {(config.yFields || ["y"]).map((y, idx) => (
            <Scatter
              key={y}
              name={y}
              dataKey={y}
              fill={
                (config.scatterColors && config.scatterColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              shape="circle"
            />
          ))}
        </RScatterChart>
      </ResponsiveContainer>
    </div>
  );
}