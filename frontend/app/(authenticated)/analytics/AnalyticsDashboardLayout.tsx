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

const ResponsiveGridLayout = WidthProvider(RGL);

const DUMMY_WIDGETS: WidgetConfig<AllWidgetSettings>[] = [
  {
    id: "1",
    type: "bar",
    title: "Orders by Status",
    settings: { type: "bar", table: "orders", xField: "status", yFields: ["count"], showLegend: true },
  },
  {
    id: "2",
    type: "line",
    title: "Revenue Trend",
    settings: { type: "line", table: "orders", xField: "date", yFields: ["revenue"], showLegend: true },
  },
  {
    id: "3",
    type: "pie",
    title: "Customers by Region",
    settings: { type: "pie", table: "customers", xField: "region", yFields: ["count"], showLegend: true },
  },
  {
    id: "4",
    type: "table",
    title: "Top Products",
    settings: { type: "table", table: "products", xField: "name", yFields: ["revenue"] },
  },
];

const DEFAULT_LAYOUT: Layout[] = [
  { i: "1", x: 0, y: 0, w: 2, h: 3, minW: 1, minH: 2 },
  { i: "2", x: 2, y: 0, w: 2, h: 3, minW: 1, minH: 2 },
  { i: "3", x: 0, y: 3, w: 1, h: 2, minW: 1, minH: 2 },
  { i: "4", x: 1, y: 3, w: 3, h: 2, minW: 1, minH: 2 },
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
  const [widgets, setWidgets] = useState<WidgetConfig<AllWidgetSettings>[]>(DUMMY_WIDGETS);
  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<null | "settings" | "insights">(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const [originalWidgetSettings, setOriginalWidgetSettings] = useState<AllWidgetSettings | null>(null);
  const [dummyRemoved, setDummyRemoved] = useState(false);

  const focusedWidget = widgets.find(w => w.id === focusedWidgetId);
  const isMobile = useIsMobile();

  useEffect(() => {
    function updateWidth() {
      let w = window.innerWidth;
      w -= 48;
      setGridWidth(w > 0 ? w : 800);
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets => widgets.filter(w => w.id !== id));
    setLayout(layout => layout.filter(l => l.i !== id));
    if (focusedWidgetId === id) {
      setFocusedWidgetId(null);
      setOpenPanel(null);
      setOriginalWidgetSettings(null);
    }
  };

  const handleAddWidget = (widget: WidgetConfig) => {
    if (!dummyRemoved) {
      setWidgets([widget]);
      setLayout([{ i: widget.id, x: 0, y: 0, w: 1, h: 3, minW: 1, minH: 2 }]);
      setDummyRemoved(true);
    } else {
      setWidgets(widgets => [...widgets, widget]);
      setLayout(layout => [
        ...layout,
        { i: widget.id, x: 0, y: Infinity, w: 1, h: 3, minW: 1, minH: 2 },
      ]);
    }
  };

  const handleLayoutChange = (newLayout: Layout[]) => setLayout(newLayout);

  const openSettingsPanel = (widgetId: string) => {
    setFocusedWidgetId(widgetId);
    setOpenPanel("settings");
    const w = widgets.find(w => w.id === widgetId);
    setOriginalWidgetSettings(w ? JSON.parse(JSON.stringify(w.settings)) : null);
  };

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

  const handleSettingsSave = () => {
    setOpenPanel(null);
    setFocusedWidgetId(null);
    setOriginalWidgetSettings(null);
  };

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

  useEffect(() => {
    if (!focusedWidgetId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSettingsCancel();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [focusedWidgetId, handleSettingsCancel]);

  if (focusedWidget) {
    const exitFocus = handleSettingsCancel;

    return (
      <AnalyticsWorkspaceLayout
        leftPanel={openPanel === "insights" ? (
          <InsightPanel widget={focusedWidget} open onClose={exitFocus} />
        ) : null}
        rightPanel={openPanel === "settings" ? (
          <SettingsPanel
            widget={focusedWidget}
            open
            onClose={handleSettingsCancel}
            onSave={handleSettingsSave}
            onLiveUpdate={handleLiveUpdateSettings}
          />
        ) : null}
      >
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full h-full bg-neutral-50 dark:bg-gray-950 p-2 sm:p-4 md:p-10 lg:p-16 transition-all duration-200">
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-center">
            <WidgetCard
              widget={focusedWidget}
              focused
              onOpenInsight={() => setOpenPanel("insights")}
              onOpenSettings={() => openSettingsPanel(focusedWidget.id)}
              onRemove={handleRemoveWidget}
              handleClassName="card-handle"
              onCloseFocus={exitFocus}
            />
          </div>
        </div>
      </AnalyticsWorkspaceLayout>
    );
  }

  return (
    <AnalyticsWorkspaceLayout
      leftPanel={openPanel === "insights" && !focusedWidget ? (
        <InsightPanel widget={undefined} open={false} onClose={() => setOpenPanel(null)} />
      ) : null}
      rightPanel={openPanel === "settings" && !focusedWidget ? (
        <SettingsPanel widget={undefined} open={false} onClose={() => setOpenPanel(null)} onSave={() => setOpenPanel(null)} />
      ) : null}
    >
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
          onAdd={(w: WidgetConfig<AllWidgetSettings>) => {
            handleAddWidget(w);
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
            {widgets.map(widget => (
              <div
                key={widget.id}
                data-grid={layout.find(l => l.i === widget.id) || { x: 0, y: Infinity, w: 1, h: 3 }}
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
                  onOpenSettings={() => openSettingsPanel(widget.id)}
                  onRemove={handleRemoveWidget}
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
