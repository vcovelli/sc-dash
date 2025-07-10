import { useState, useLayoutEffect } from "react";
import { WidgetConfig, AllWidgetSettings, WidgetType } from "../types";
import { BarChart2, LineChart, PieChart, Table as TableIcon, X, TrendingUp, Zap, Target, BarChart3 } from "lucide-react";

// UUID fallback for environments without crypto.randomUUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Modal docked at bottom right, always visible on all screens
function useDockedPosition(width = 380, height = 410, margin = 32) {
  const [pos, setPos] = useState({ right: margin, bottom: margin, width, height });
  useLayoutEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos({
        right: margin,
        bottom: margin,
        width: Math.min(width, vw - margin * 2),
        height: Math.min(height, vh - margin * 2),
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height, margin]);
  return pos;
}

type AddWidgetModalProps = {
  onAdd: (widget: WidgetConfig<AllWidgetSettings>) => void;
  onClose: () => void;
};

// --- Settings templates for each type ---
const DEFAULT_SETTINGS: Record<WidgetType, AllWidgetSettings> = {
  bar:      { type: "bar",      table: "orders",    xField: "status",  yFields: ["count"], showLegend: true },
  line:     { type: "line",     table: "orders",    xField: "date",    yFields: ["revenue"], showLegend: true },
  pie:      { type: "pie",      table: "customers", xField: "region",  yFields: ["count"], showLegend: true },
  table:    { type: "table",    table: "products",  xField: "name",    yFields: ["revenue"] },
  area:     { type: "area",     table: "orders",    xField: "date",    yFields: ["revenue", "profit"], showLegend: true, stacked: false, fillOpacity: 0.6 },
  scatter:  { type: "scatter",  table: "orders",    xField: "quantity", yFields: ["price"], showLegend: true, dotSize: 4 },
  radar:    { type: "radar",    table: "metrics",  xField: "category", yFields: ["score"], showLegend: true, fillOpacity: 0.6 },
  composed: { type: "composed", table: "orders",    xField: "date",    yFields: ["revenue", "count"], chartTypes: ["line", "bar"], showLegend: true }
};

const TITLES: Record<WidgetType, string> = {
  bar: "Bar Widget",
  line: "Line Widget",
  pie: "Pie Widget",
  table: "Table Widget",
  area: "Area Widget",
  scatter: "Scatter Widget",
  radar: "Radar Widget",
  composed: "Composed Widget"
};

const PREVIEW_TEXT: Record<WidgetType, string> = {
  bar: "Bar Chart Preview",
  line: "Line Chart Preview",
  pie: "Pie Chart Preview",
  table: "Table Preview",
  area: "Area Chart Preview",
  scatter: "Scatter Plot Preview",
  radar: "Radar Chart Preview",
  composed: "Composed Chart Preview"
};

export default function AddWidgetModal({ onAdd, onClose }: AddWidgetModalProps) {
  const [type, setType] = useState<WidgetType>("bar");
  const pos = useDockedPosition();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-end"
      aria-modal="true"
      tabIndex={-1}
      style={{ pointerEvents: "auto" }}
      onClick={onClose}
    >
      <div
        className={`
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col p-4 sm:p-6
          animate-fade-in-up max-h-[90vh] overflow-y-auto
        `}
        style={{
          position: "absolute",
          right: pos.right,
          bottom: pos.bottom,
          width: pos.width,
          maxWidth: 420,
          minWidth: 260,
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.14)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Add Widget</h2>
          <button
            onClick={onClose}
            className="text-2xl rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
            aria-label="Close"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chart type selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <WidgetTypeButton
            icon={<BarChart2 className="w-6 h-6" />}
            label="Bar"
            active={type === "bar"}
            onClick={() => setType("bar")}
          />
          <WidgetTypeButton
            icon={<LineChart className="w-6 h-6" />}
            label="Line"
            active={type === "line"}
            onClick={() => setType("line")}
          />
          <WidgetTypeButton
            icon={<PieChart className="w-6 h-6" />}
            label="Pie"
            active={type === "pie"}
            onClick={() => setType("pie")}
          />
          <WidgetTypeButton
            icon={<TableIcon className="w-6 h-6" />}
            label="Table"
            active={type === "table"}
            onClick={() => setType("table")}
          />
          <WidgetTypeButton
            icon={<TrendingUp className="w-6 h-6" />}
            label="Area"
            active={type === "area"}
            onClick={() => setType("area")}
          />
          <WidgetTypeButton
            icon={<Zap className="w-6 h-6" />}
            label="Scatter"
            active={type === "scatter"}
            onClick={() => setType("scatter")}
          />
          <WidgetTypeButton
            icon={<Target className="w-6 h-6" />}
            label="Radar"
            active={type === "radar"}
            onClick={() => setType("radar")}
          />
          <WidgetTypeButton
            icon={<BarChart3 className="w-6 h-6" />}
            label="Mixed"
            active={type === "composed"}
            onClick={() => setType("composed")}
          />
        </div>

        <div className="rounded-xl bg-neutral-100 dark:bg-gray-800 flex items-center justify-center h-28 text-gray-400 mb-4 text-center text-base">
          {PREVIEW_TEXT[type]}
        </div>

        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          onClick={() => {
            onAdd({
              id: uuidv4(),
              type,
              title: TITLES[type],
              settings: { ...DEFAULT_SETTINGS[type] }
            });
          }}
        >Add Widget</button>
      </div>
    </div>
  );
}

type WidgetTypeButtonProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
};

// -- Button for each chart type
function WidgetTypeButton({ icon, label, active, onClick }: WidgetTypeButtonProps) {
  return (
    <button
      className={`
        flex flex-col items-center justify-center flex-1 px-2 py-3 rounded-xl border
        ${active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 font-bold"
          : "border-gray-200 dark:border-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-800"}
        transition
      `}
      style={{
        minWidth: 68,
        minHeight: 62,
        fontSize: 15,
      }}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );
}
