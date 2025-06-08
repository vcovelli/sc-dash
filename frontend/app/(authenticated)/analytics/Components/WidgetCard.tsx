import { useState } from "react";
import { WidgetConfig } from "../types";
import {
  BarChartWidget,
  LineChartWidget,
  PieChartWidget,
  TableChartWidget,
} from "./WidgetCharts";
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";

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

  let ChartComponent = null;
  switch (widget.type) {
    case "bar":
      ChartComponent = <BarChartWidget config={widget.settings} />;
      break;
    case "line":
      ChartComponent = <LineChartWidget config={widget.settings} />;
      break;
    case "pie":
      ChartComponent = <PieChartWidget config={widget.settings} />;
      break;
    case "table":
      ChartComponent = <TableChartWidget config={widget.settings} />;
      break;
    default:
      ChartComponent = <div>No chart type</div>;
  }

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-900 flex flex-col ring-2 border transition
        ${focused
          ? "ring-blue-500 shadow-2xl scale-[1.025] z-30 border-blue-200 dark:border-blue-800"
          : "ring-transparent shadow border-gray-100 dark:border-gray-800"}
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

      {/* Header, with handle gap! */}
      <div className="flex justify-between items-center mb-2 pl-9 md:pl-10">
        <h3 className="text-lg font-semibold truncate">{widget.title}</h3>
        {/* Chevron for controls */}
        <button
          className="p-1 ml-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
          onClick={() => setControlsOpen((v) => !v)}
          aria-label={controlsOpen ? "Hide controls" : "Show controls"}
          title={controlsOpen ? "Hide controls" : "Show controls"}
        >
          {controlsOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {/* Controls Popover */}
        <div
          className={`
            absolute right-3 top-10 flex gap-1 items-center
            transition-all duration-200
            ${controlsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            bg-white/95 dark:bg-gray-900/95 px-2 py-1 rounded-lg shadow z-20
          `}
          style={{
            minWidth: 170,
            boxShadow: controlsOpen
              ? "0 4px 20px 0 rgba(59,130,246,0.08)"
              : undefined,
          }}
        >
          <button
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
            onClick={e => {
              e.stopPropagation();
              onFocus?.();
              setControlsOpen(false);
            }}
            aria-label="Focus chart"
            title="Focus"
          >
            <span role="img" aria-label="focus">🔍</span>
          </button>
          <button
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
            onClick={e => {
              e.stopPropagation();
              onOpenInsight?.();
              setControlsOpen(false);
            }}
            aria-label="Show insights"
            title="Insights"
          >
            <span role="img" aria-label="insight">📊</span>
          </button>
          <button
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
            onClick={e => {
              e.stopPropagation();
              onOpenSettings?.();
              setControlsOpen(false);
            }}
            aria-label="Widget settings"
            title="Settings"
          >
            <span role="img" aria-label="settings">⚙️</span>
          </button>
          {onRemove && !focused && (
            <button
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-800 transition"
              onClick={e => {
                e.stopPropagation();
                onRemove(widget.id);
                setControlsOpen(false);
              }}
              aria-label="Remove widget"
              title="Remove"
            >
              <span role="img" aria-label="remove">🗑️</span>
            </button>
          )}
          {focused && onCloseFocus && (
            <button
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition ml-2"
              onClick={onCloseFocus}
              aria-label="Close focus"
              title="Close"
              style={{ fontSize: 22, lineHeight: 1 }}
            >
              ✖️
            </button>
          )}
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
