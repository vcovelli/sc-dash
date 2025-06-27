"use client";

import { useState, useEffect, useCallback } from "react";
import AnalyticsWorkspaceLayout from "./Dashboard/AnalyticsWorkspaceLayout";
import WidgetCard from "./Components/WidgetCard";
import SettingsPanel from "./Components/SettingsPanel/SettingsPanel";
import InsightPanel from "./Components/InsightPanel";
import AddWidgetModal from "./Components/AddWidgetModal";
import { WidgetConfig, AllWidgetSettings } from "./types";
import RGL, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// --- API FUNCTIONS ---
import {
  getDashboard,
  createChart,
  updateChart,
  deleteChart,
  updateDashboardLayout,
  markOnboardingStep,
} from "@/lib/analyticsAPI";

const ResponsiveGridLayout = WidthProvider(RGL);

// --- SAMPLE CHARTS ---
const SAMPLE_WIDGETS: WidgetConfig<AllWidgetSettings>[] = [
  {
    id: "sample-bar",
    type: "bar",
    title: "Orders by Status",
    settings: { type: "bar", table: "orders", xField: "status", yFields: ["count"], showLegend: true },
    sample: true,
  },
  {
    id: "sample-line",
    type: "line",
    title: "Revenue Trend",
    settings: { type: "line", table: "orders", xField: "date", yFields: ["revenue"], showLegend: true },
    sample: true,
  },
  {
    id: "sample-pie",
    type: "pie",
    title: "Customers by Region",
    settings: { type: "pie", table: "customers", xField: "region", yFields: ["count"], showLegend: true },
    sample: true,
  },
  {
    id: "sample-table",
    type: "table",
    title: "Top Products",
    settings: { type: "table", table: "products", xField: "name", yFields: ["revenue"] },
    sample: true,
  },
];

const SAMPLE_LAYOUT: Layout[] = [
  { i: "sample-bar", x: 0, y: 0, w: 2, h: 3, minW: 1, minH: 2 },
  { i: "sample-line", x: 2, y: 0, w: 2, h: 3, minW: 1, minH: 2 },
  { i: "sample-pie", x: 0, y: 3, w: 1, h: 2, minW: 1, minH: 2 },
  { i: "sample-table", x: 1, y: 3, w: 3, h: 2, minW: 1, minH: 2 },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640); // Tailwind 'sm'
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function AnalyticsDashboardLayout() {
  // --- Main State ---
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig<AllWidgetSettings>[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<null | "settings" | "insights">(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const [originalWidgetSettings, setOriginalWidgetSettings] = useState<AllWidgetSettings | null>(null);
  const isMobile = useIsMobile();
  const [dashboardSetupState, setDashboardSetupState] = useState<"empty" | "ready">("ready");
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);

 // --- LOAD DASHBOARD on mount ---
  useEffect(() => {
    getDashboard().then((data) => {
      const dashboard = Array.isArray(data) ? data[0] : data;

      if (!dashboard) {
        setDashboardId(null);
        setWidgets(SAMPLE_WIDGETS);
        setLayout(SAMPLE_LAYOUT);
        setDashboardSetupState("empty");
        setCompletedKeys([]);
        return;
      }

      setDashboardId(dashboard.id);

      // Onboarding step logic
      let steps: string[] = [];
      if (dashboard.charts && dashboard.charts.length > 0) {
        steps.push("dashboard"); // Your "Set Up Your First Dashboard" step
      }
      // If you can detect more steps (e.g. uploaded data, mapped schema), add them here.
      setCompletedKeys(steps);

      if (!dashboard.charts || dashboard.charts.length === 0) {
        setWidgets(SAMPLE_WIDGETS);
        setLayout(SAMPLE_LAYOUT);
        setDashboardSetupState("empty");
      } else {
        setWidgets(dashboard.charts);
        setLayout(
          Array.isArray(dashboard.layout)
            ? dashboard.layout.map(l => ({ ...l, i: String(l.i) }))
            : []
        );
        setDashboardSetupState("ready");
      }
    });
  }, []);

  // --- Responsive grid width ---
  useEffect(() => {
    function updateWidth() {
      let w = window.innerWidth - 48;
      setGridWidth(w > 0 ? w : 800);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // --- REMOVE Widget ---
  const handleRemoveWidget = async (id: string) => {
    await deleteChart(id);
    const newWidgets = widgets.filter(w => w.id !== id);
    const newLayout = layout.filter(l => l.i !== id);
    setWidgets(newWidgets);
    setLayout(newLayout);
    if (focusedWidgetId === id) {
      setFocusedWidgetId(null);
      setOpenPanel(null);
      setOriginalWidgetSettings(null);
    }
    await updateDashboardLayout(dashboardId, newLayout);
  };

  // --- ADD Widget ---
  const handleAddWidget = async (widget: WidgetConfig) => {
    const payload = {
      dashboard: dashboardId,
      chart_type: widget.type,
      title: widget.title,
      settings: widget.settings,
      position: 0,          // or however you want to order
      size: "medium",
      data_source: {},
    };
    // Only send what backend expects!
    const res = await createChart(payload);

    // If showing samples, replace with real chart(s)
    if (widgets.length > 0 && widgets.every(w => w.sample)) {
      setWidgets([res]);
      setLayout([{ i: String(res.id), x: 0, y: 0, w: 1, h: 3, minW: 1, minH: 2 }]);
    } else {
      const newWidgets = [...widgets, res];
      const newLayout = [
        ...layout,
        { i: String(res.id), x: 0, y: Infinity, w: 1, h: 3, minW: 1, minH: 2 },
      ];
      setWidgets(newWidgets);
      setLayout(newLayout);
    }
    await updateDashboardLayout(dashboardId, layout);
    // Mark onboarding when first chart is created
    if (widgets.length === 0 || widgets.every(w => w.sample)) await markOnboardingStep("created_first_chart");
  };

  // --- Layout changes (resize, move) ---
  const handleLayoutChange = async (newLayout: Layout[]) => {
    setLayout(newLayout);
    await updateDashboardLayout(dashboardId, newLayout);
  };

  // --- Panel Logic ---
  const openSettingsPanel = (widgetId: string) => {
    setFocusedWidgetId(widgetId);
    setOpenPanel("settings");
    const w = widgets.find((w) => w.id === widgetId);
    setOriginalWidgetSettings(w ? JSON.parse(JSON.stringify(w.settings)) : null);
  };

  // --- Live Update Settings in UI ---
  const handleLiveUpdateSettings = (liveSettings: Partial<AllWidgetSettings>) => {
    if (!focusedWidgetId) return;
    setWidgets(widgets =>
      widgets.map(w =>
        w.id === focusedWidgetId
          ? { ...w, settings: { ...w.settings, ...liveSettings } }
          : w
      )
    );
  };

  // --- SAVE Widget settings (persist) ---
  const handleSettingsSave = async () => {
    if (focusedWidgetId) {
      const updated = widgets.find((w) => w.id === focusedWidgetId);
      if (updated) {
        await updateChart(focusedWidgetId, { settings: updated.settings });
      }
    }
    setOpenPanel(null);
    setFocusedWidgetId(null);
    setOriginalWidgetSettings(null);
  };

  // --- CANCEL Widget settings ---
  const handleSettingsCancel = useCallback(() => {
    if (focusedWidgetId && originalWidgetSettings) {
      setWidgets(widgets =>
        widgets.map(w =>
          w.id === focusedWidgetId
            ? { ...w, settings: { ...originalWidgetSettings } }
            : w
        )
      );
    }
    setOpenPanel(null);
    setFocusedWidgetId(null);
    setOriginalWidgetSettings(null);
  }, [focusedWidgetId, originalWidgetSettings]);

  // --- Escape key closes panels ---
  useEffect(() => {
    if (!focusedWidgetId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSettingsCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedWidgetId, handleSettingsCancel]);

  // --- FOCUS MODE ---
  const focusedWidget = widgets.find((w) => w.id === focusedWidgetId);
  if (focusedWidget) {
    const exitFocus = handleSettingsCancel;
    return (
      <AnalyticsWorkspaceLayout
        leftPanel={
          openPanel === "insights" ? (
            <InsightPanel widget={focusedWidget} open onClose={exitFocus} />
          ) : null
        }
        rightPanel={
          openPanel === "settings" ? (
            <SettingsPanel
              widget={focusedWidget}
              open
              onClose={handleSettingsCancel}
              onSave={handleSettingsSave}
              onLiveUpdate={handleLiveUpdateSettings}
            />
          ) : null
        }
      >
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full h-full bg-neutral-50 dark:bg-gray-950 p-2 sm:p-4 md:p-10 lg:p-16 transition-all duration-200">
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-center">
            <WidgetCard
              widget={focusedWidget}
              focused
              onOpenInsight={() => setOpenPanel("insights")}
              onOpenSettings={() => openSettingsPanel(focusedWidget.id)}
              onRemove={focusedWidget.sample ? undefined : handleRemoveWidget}
              handleClassName="card-handle"
              onCloseFocus={exitFocus}
            />
          </div>
        </div>
      </AnalyticsWorkspaceLayout>
    );
  }

  // --- DASHBOARD NORMAL MODE ---
  return (
    <AnalyticsWorkspaceLayout
      leftPanel={openPanel === "insights" && !focusedWidget ? (
        <InsightPanel widget={undefined} open={false} onClose={() => setOpenPanel(null)} />
      ) : null}
      rightPanel={openPanel === "settings" && !focusedWidget ? (
        <SettingsPanel widget={undefined} open={false} onClose={() => setOpenPanel(null)} onSave={() => setOpenPanel(null)} />
      ) : null}
    >
      {/* Add Widget Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl hover:bg-blue-700 z-40"
        style={{ boxShadow: "0 4px 24px 0 rgba(59,130,246,0.20)" }}
        aria-label="Add Widget"
      >
        +
      </button>
      {showAddModal && (
        <AddWidgetModal
          onAdd={async (w: WidgetConfig<AllWidgetSettings>) => {
            await handleAddWidget(w);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      <div className="flex-1 h-full min-h-0 w-full relative">
        {gridWidth !== null && (
          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={isMobile ? 1 : 4}
            rowHeight={isMobile ? 180 : 120}
            width={gridWidth}
            onLayoutChange={handleLayoutChange}
            margin={isMobile ? [0, 16] : [24, 24]}
            isResizable={!isMobile}
            isDraggable={!isMobile}
            resizeHandles={["e", "se"]}
            useCSSTransforms
            compactType={isMobile ? null : "vertical"}
            draggableHandle=".card-handle"
            preventCollision={false}
            style={{
              minHeight: "calc(100vh - 120px)",
              height: "100%",
              width: "100%",
              overflowY: isMobile ? "visible" : "auto",
              paddingBottom: 24,
            }}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                data-grid={layout.find((l) => l.i === widget.id) || { x: 0, y: Infinity, w: 1, h: 3 }}
                style={{ height: "100%", width: "100%" }}
              >
                <WidgetCard
                  widget={widget}
                  focused={false}
                  onFocus={() => {
                    setFocusedWidgetId(widget.id);
                    setOpenPanel(null);
                  }}
                  onOpenInsight={() => {
                    setFocusedWidgetId(widget.id);
                    setOpenPanel("insights");
                  }}
                  onOpenSettings={widget.sample ? () => setShowAddModal(true) : () => openSettingsPanel(widget.id)}
                  onRemove={widget.sample ? undefined : handleRemoveWidget}
                  handleClassName="card-handle"
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </AnalyticsWorkspaceLayout>
  );
}
