import React from "react";
import {
  ResponsiveContainer,
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6", "#f59e42", "#10b981", "#ef4444", "#a78bfa", "#f43f5e", "#facc15"
];

const SAMPLE_DATA = [
  { subject: "Sales", A: 120, B: 110, fullMark: 150 },
  { subject: "Marketing", A: 98, B: 130, fullMark: 150 },
  { subject: "Development", A: 86, B: 130, fullMark: 150 },
  { subject: "Customer Support", A: 99, B: 100, fullMark: 150 },
  { subject: "Information Technology", A: 85, B: 90, fullMark: 150 },
  { subject: "Administration", A: 65, B: 85, fullMark: 150 },
];

// ---- Types ----
type RadarChartConfig = {
  xField: string;
  yFields: string[];
  radarColors?: string[];
  showLegend?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
};

type DataRow = Record<string, unknown>;

export function RadarChartWidget({
  config,
  data,
}: {
  config: RadarChartConfig;
  data?: DataRow[];
}) {
  const radarData = data || SAMPLE_DATA;

  // Guard: No data, or not enough fields specified
  if (
    !radarData ||
    radarData.length === 0 ||
    !config.xField ||
    !config.yFields?.length
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400">
        No data to display.
      </div>
    );
  }

  const fillOpacity = config.fillOpacity ?? 0.6;
  const strokeWidth = config.strokeWidth ?? 2;

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RRadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey={config.xField || "subject"} />
          <PolarRadiusAxis />
          {config.showLegend !== false && <Legend />}
          {(config.yFields || ["A"]).map((y, idx) => (
            <Radar
              key={y}
              name={y}
              dataKey={y}
              stroke={
                (config.radarColors && config.radarColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              fill={
                (config.radarColors && config.radarColors[idx]) ||
                COLORS[idx % COLORS.length]
              }
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
            />
          ))}
        </RRadarChart>
      </ResponsiveContainer>
    </div>
  );
}