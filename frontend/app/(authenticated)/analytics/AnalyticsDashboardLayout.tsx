"use client";
import { useState, useEffect } from "react";
import AnalyticsWorkspaceLayout from "./Dashboard/AnalyticsWorkspaceLayout";
import WidgetCard from "./Components/WidgetCard";
import SettingsPanel from "./Components/SettingsPanel";
import InsightPanel from "./Components/InsightPanel";
import AddWidgetModal from "./Components/AddWidgetModal";
import { WidgetConfig } from "./types";
import RGL, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(RGL);

const DUMMY_WIDGETS: WidgetConfig[] = [
  {
    id: "1",
    type: "bar",
    title: "Orders by Status",
    settings: { table: "orders", xField: "status", yFields: ["count"], showLegend: true },
  },
  {
    id: "2",
    type: "line",
    title: "Revenue Trend",
    settings: { table: "orders", xField: "date", yFields: ["revenue"], showLegend: true },
  },
];

const DEFAULT_LAYOUT: Layout[] = [
  { i: "1", x: 0, y: 0, w: 1, h: 3, minW: 1, minH: 2 },
  { i: "2", x: 1, y: 0, w: 1, h: 3, minW: 1, minH: 2 },
];

const NAVBAR_HEIGHT = 64;

export default function AnalyticsDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DUMMY_WIDGETS);
  const [layout, setLayout] = useState<Layout[]>(DEFAULT_LAYOUT);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<null | "settings" | "insights">(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gridWidth, setGridWidth] = useState<number | null>(null);

  // NEW: for live editing and revert-on-cancel
  const [originalWidgetSettings, setOriginalWidgetSettings] = useState<any>(null);

  const focusedWidget = widgets.find(w => w.id === focusedWidgetId);

  // Responsive grid width calc (for grid view only)
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

  // Remove widget by id (also removes from layout)
  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets => widgets.filter(w => w.id !== id));
    setLayout(layout => layout.filter(l => l.i !== id));
    if (focusedWidgetId === id) {
      setFocusedWidgetId(null);
      setOpenPanel(null);
      setOriginalWidgetSettings(null);
    }
  };

  // Add widget from modal
  const handleAddWidget = (widget: WidgetConfig) => {
    setWidgets(widgets => [...widgets, widget]);
    setLayout(layout => [
      ...layout,
      { i: widget.id, x: 0, y: Infinity, w: 1, h: 3, minW: 1, minH: 2 },
    ]);
  };

  // Layout change (on drag/resize)
  const handleLayoutChange = (newLayout: Layout[]) => setLayout(newLayout);

  // --- Handle Settings: Open, Live Edit, Save, Cancel ---
  const openSettingsPanel = (widgetId: string) => {
    setFocusedWidgetId(widgetId);
    setOpenPanel("settings");
    // Save a deep copy of the current widget settings for revert-on-cancel
    const w = widgets.find(w => w.id === widgetId);
    setOriginalWidgetSettings(w ? JSON.parse(JSON.stringify(w.settings)) : null);
  };

  // Called on every tweak in SettingsPanel: updates widget settings live
  const handleLiveUpdateSettings = (liveSettings: any) => {
    if (!focusedWidgetId) return;
    setWidgets(widgets =>
      widgets.map(w =>
        w.id === focusedWidgetId
          ? { ...w, settings: { ...w.settings, ...liveSettings } }
          : w
      )
    );
  };

  // On Save: settings are already live, just close panel and clear original
  const handleSettingsSave = () => {
    setOpenPanel(null);
    setFocusedWidgetId(null);
    setOriginalWidgetSettings(null);
  };

  // On Cancel/X: restore original settings before closing
  const handleSettingsCancel = () => {
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
  };

  // Keyboard: Close focus mode with ESC (restores original settings if open)
  useEffect(() => {
    if (!focusedWidgetId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSettingsCancel();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [focusedWidgetId, originalWidgetSettings]);

  // --- FOCUS MODE ---
  if (focusedWidget) {
    const exitFocus = handleSettingsCancel; // Always restore if open

    return (
      <AnalyticsWorkspaceLayout
        leftPanel={openPanel === "insights" ? (
          <InsightPanel
            widget={focusedWidget}
            open
            onClose={exitFocus}
          />
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
        {/* Responsive outer padding, max-width for ultra-wide screens */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full h-full bg-neutral-50 dark:bg-gray-950
                        p-2 sm:p-4 md:p-10 lg:p-16 transition-all duration-200">
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

  // --- GRID MODE ---
  return (
    <AnalyticsWorkspaceLayout
      leftPanel={openPanel === "insights" && !focusedWidget ? (
        <InsightPanel
          widget={null}
          open={false}
          onClose={() => setOpenPanel(null)}
        />
      ) : null}
      rightPanel={openPanel === "settings" && !focusedWidget ? (
        <SettingsPanel
          widget={null}
          open={false}
          onClose={() => setOpenPanel(null)}
          onSave={() => setOpenPanel(null)}
        />
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
          onAdd={w => {
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
            cols={4}
            rowHeight={120}
            width={gridWidth}
            onLayoutChange={handleLayoutChange}
            margin={[24, 24]}
            isResizable
            isDraggable
            useCSSTransforms
            compactType="vertical"
            draggableHandle=".card-handle"
            preventCollision={false}
            minW={1}
            style={{
              minHeight: "calc(100vh - 120px)", // adjusts for navbar/side panels
              height: "100%",
              width: "100%",
              overflowY: "auto",
              paddingBottom: 24,
            }}
          >
            {widgets.map(widget => (
              <div key={widget.id}
                data-grid={layout.find(l => l.i === widget.id) || { x: 0, y: Infinity, w: 1, h: 3 }}
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
