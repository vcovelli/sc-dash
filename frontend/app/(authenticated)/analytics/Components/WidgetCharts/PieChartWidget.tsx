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

export function PieChartWidget({
  config,
  data,
}: {
  config: PieChartConfig;
  data?: DataRow[];
}) {
  const pieData = data || SAMPLE_DATA;
  const valueKey = (config.yFields && config.yFields[0]) || "count";
  const nameKey = config.xField || "name";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"           // Move up a bit to make space for legend
            outerRadius="70%"  // Use % to be responsive!
            label
          >
            {pieData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
