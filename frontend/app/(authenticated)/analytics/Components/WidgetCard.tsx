"use client";

import { useState, useEffect } from "react";
import { WidgetConfig } from "../types";
import {
  BarChartWidget,
  LineChartWidget,
  PieChartWidget,
  TableChartWidget,
  AreaChartWidget,
  ScatterChartWidget,
  RadarChartWidget,
  ComposedChartWidget,
} from "./WidgetCharts";
import { GripVertical, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { getChartData } from "@/lib/analyticsAPI";
import type { DataRow } from "@/app/(authenticated)/analytics/types";
import { DataFreshnessIndicator } from "./DataFreshnessIndicator";

const SAMPLE_DATA = [
  { name: "A", count: 400, revenue: 2400 },
  { name: "B", count: 300, revenue: 2210 },
  { name: "C", count: 200, revenue: 2290 },
  { name: "D", count: 278, revenue: 2000 },
  { name: "E", count: 189, revenue: 2181 },
];

// Transform raw data from backend to chart format
const transformDataForChart = (
  rawData: Record<string, unknown>[],
  settings: { xField?: string; yFields?: string[]; type?: string }
): DataRow[] => {
  if (!rawData || rawData.length === 0) return [];

  return rawData.map(row => {
    const data = (row as { data?: Record<string, unknown> }).data || row;

    // Always set `name` to the xField value, or empty string fallback
    const name =
      settings.xField && data[settings.xField] !== undefined
        ? String(data[settings.xField])
        : "";

    const transformedRow: DataRow = { name };

    // Add yFields
    if (settings.yFields && Array.isArray(settings.yFields)) {
      settings.yFields.forEach((yField: string) => {
        if (data[yField] !== undefined) {
          const value = data[yField];
          transformedRow[yField] =
            typeof value === "number"
              ? value
              : value !== undefined
                ? Number(value)
                : undefined;
        }
      });
    }

    // For pie, add .value as well (Recharts Pie expects value)
    if (settings.type === "pie" && settings.yFields?.[0]) {
      const v = data[settings.yFields[0]];
      transformedRow.value =
        typeof v === "number"
          ? v
          : v !== undefined
            ? Number(v)
            : 1;
    }

    // For table, include all configured fields (already handled above, but safe to repeat)
    if (settings.type === "table") {
      const allFields = [settings.xField, ...(settings.yFields || [])];
      allFields.forEach(field => {
        if (field && data[field] !== undefined) {
          const val = data[field];
          if (val === null) {
            transformedRow[field] = undefined;
          } else if (typeof val === "string" || typeof val === "number") {
            transformedRow[field] = val;
          } else {
            transformedRow[field] = undefined;
          }
        }
      });
    }

    return transformedRow;
  });
};

export default function WidgetCard({
  widget,
  focused,
  onRemove,
  handleClassName = "",
  onFocus,
  onOpenInsight,
  onOpenSettings,
  onCloseFocus,
}: {
  widget: WidgetConfig;
  focused: boolean;
  onRemove?: (id: string) => void;
  handleClassName?: string;
  onFocus?: () => void;
  onOpenInsight?: () => void;
  onOpenSettings?: () => void;
  onCloseFocus?: () => void;
}) {
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chartData, setChartData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch real data when widget settings change
  useEffect(() => {
    const fetchData = async () => {
      // Use sample data for sample widgets or when no table is specified
      if (widget.sample || !widget.settings?.table) {
        setChartData(SAMPLE_DATA);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const rawData = await getChartData(widget.settings);
        const transformedData = transformDataForChart(rawData, widget.settings);
        setChartData(transformedData);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        setError("Failed to load chart data");
        // Fallback to sample data on error
        setChartData(SAMPLE_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget.settings, widget.sample]);

  let ChartComponent = null;
  
  if (loading) {
    ChartComponent = (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Loading chart data...</span>
        </div>
      </div>
    );
  } else if (error && !widget.sample) {
    ChartComponent = (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <span className="text-sm">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  } else {
    switch (widget.type) {
      case "bar":
        ChartComponent = <BarChartWidget config={widget.settings} data={chartData} />;
        break;
      case "line":
        ChartComponent = <LineChartWidget config={widget.settings} data={chartData} />;
        break;
      case "pie":
        ChartComponent = <PieChartWidget config={widget.settings} data={chartData} />;
        break;
      case "table":
        ChartComponent = <TableChartWidget config={widget.settings} data={chartData} />;
        break;
      case "area":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ChartComponent = <AreaChartWidget config={widget.settings as any} data={chartData} />;
        break;
      case "scatter":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ChartComponent = <ScatterChartWidget config={widget.settings as any} data={chartData} />;
        break;
      case "radar":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ChartComponent = <RadarChartWidget config={widget.settings as any} data={chartData} />;
        break;
      case "composed":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ChartComponent = <ComposedChartWidget config={widget.settings as any} data={chartData} />;
        break;
      default:
        ChartComponent = <div>No chart type</div>;
    }
  }

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-900 flex flex-col ring-2 border transition
        text-gray-800 dark:text-gray-100
        ...
        h-full w-full min-h-0 min-w-0
        rounded-none md:rounded-2xl
        px-2 sm:px-4 md:px-8 py-2 md:py-4
      `}
      style={{ display: "flex", overflow: "hidden" }}
    >
      {/* OUTER BIG LEFT HANDLE (Not blocking title, always visible/tappable) */}
      <div
        className={`
          absolute -left-4 md:-left-5 top-0 bottom-0 flex flex-col items-center justify-center 
          z-30 card-handle cursor-grab select-none
          ${handleClassName}
        `}
        style={{
          width: 36,
          minHeight: 64,
          touchAction: "none",
          pointerEvents: "auto",
        }}
        title="Drag to move"
      >
        <div
          className="flex flex-col items-center justify-center w-8 h-12 rounded-lg bg-white/80 dark:bg-gray-900/60 hover:bg-blue-100 dark:hover:bg-blue-900"
          style={{
            boxShadow: "0 1px 6px 0 rgba(0,0,0,0.04)",
          }}
        >
          <GripVertical className="w-7 h-7 text-gray-300" />
        </div>
      </div>

      {/* Header Row with Title + Controls */}
      <div className="flex justify-between items-center mb-2 pl-9 md:pl-10">
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">
            {widget.title}
            {widget.sample && (
              <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                Sample
              </span>
            )}
          </h3>
          {!widget.sample && (
            <DataFreshnessIndicator
              lastUpdated={lastUpdated || undefined}
              isLoading={loading}
              onRefresh={() => {
                const fetchData = async () => {
                  if (widget.sample || !widget.settings?.table) {
                    setChartData(SAMPLE_DATA);
                    return;
                  }

                  setLoading(true);
                  setError(null);
                  
                  try {
                    const rawData = await getChartData(widget.settings);
                    const transformedData = transformDataForChart(rawData, widget.settings);
                    setChartData(transformedData);
                    setLastUpdated(new Date());
                    setError(null);
                  } catch (err) {
                    console.error("Failed to fetch chart data:", err);
                    setError("Failed to load chart data");
                    setChartData(SAMPLE_DATA);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchData();
              }}
              className="mt-1"
            />
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Chevron for controls */}
          <button
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
            onClick={() => setControlsOpen(v => !v)}
            aria-label={controlsOpen ? "Hide controls" : "Show controls"}
            title={controlsOpen ? "Hide controls" : "Show controls"}
          >
            {controlsOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>

          {/* Close focus button */}
          {focused && onCloseFocus && (
            <button
              onClick={onCloseFocus}
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-black dark:text-gray-300 dark:hover:text-white"
              aria-label="Exit focus mode"
              title="Exit Focus Mode"
            >
              ✖️
            </button>
          )}

          {/* Controls Popover */}
          <div
            className={`absolute right-0 top-10 flex gap-2 items-center
              transition-all duration-200
              ${controlsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
              bg-white/95 dark:bg-gray-900/95 px-3 py-2 rounded-lg shadow z-20`}
            style={{
              minWidth: 180,
              boxShadow: controlsOpen ? "0 4px 20px 0 rgba(59,130,246,0.08)" : undefined,
            }}
          >
            <button
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
              onClick={e => {
                e.stopPropagation();
                onFocus?.();
                setControlsOpen(false);
              }}
              aria-label="Focus chart"
              title="Focus"
            >
              🔍
            </button>
            <button
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
              onClick={e => {
                e.stopPropagation();
                onOpenInsight?.();
                setControlsOpen(false);
              }}
              aria-label="Show insights"
              title="Insights"
            >
              📊
            </button>
            <button
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
              onClick={e => {
                e.stopPropagation();
                onOpenSettings?.();
                setControlsOpen(false);
              }}
              aria-label="Widget settings"
              title="Settings"
            >
              ⚙️
            </button>
            {onRemove && !focused && (
              <button
                className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-800 transition"
                onClick={e => {
                  e.stopPropagation();
                  onRemove(widget.id);
                  setControlsOpen(false);
                }}
                aria-label="Remove widget"
                title="Remove"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 flex min-h-0 min-w-0">
        <div className="flex-1 flex items-stretch justify-stretch h-full w-full min-h-0 min-w-0">
          <div className="w-full h-full min-h-0 min-w-0 relative">
            {ChartComponent}
          </div>
        </div>
      </div>
    </div>
  );
}
