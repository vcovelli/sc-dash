// components/WidgetCharts/LineChartWidget.tsx
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
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

export function LineChartWidget({ config, data }) {
  const lineData = data || SAMPLE_DATA;
  return (
    <div className="w-full h-full min-w-0 min-h-0 flex items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={config.xField || "name"} />
          <YAxis />
          <Tooltip />
          <Legend />
          {(config.yFields || ["revenue"]).map((y, idx) => (
            <Line
              key={y}
              type="monotone"
              dataKey={y}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
