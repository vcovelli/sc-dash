"use client";

import React, { useState, useEffect } from "react";
import RelationalWorkspaceLayout from "@/app/(authenticated)/relational-ui/components/Sheet/RelationalWorkspaceLayout";
import GridTable from "@/app/(authenticated)/relational-ui/components/Grid/GridTable";
import ColumnSettingsPanel from "@/app/(authenticated)/relational-ui/components/UX/ColumnSettingsPanel";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { TableSettingsProvider } from "@/app/(authenticated)/relational-ui/components/UX/TableSettingsContext";
import { useNavbarVisibility } from "@/components/ClientLayoutWrapper";
import TableSelectorPanel from "@/app/(authenticated)/relational-ui/components/UX/TableSelectorPanel";
import { useUserSettings } from "@/components/UserSettingsContext";
import { useProfile } from "@/hooks/useProfile";
import { FONT_SIZE_PRESETS } from "@/components/FontSizeDropdown";
import { enrichSchemaWithReferenceData } from "@/app/(authenticated)/relational-ui/components/Grid/enrichSchema";
import { generateEmptyRow } from "@/app/(authenticated)/relational-ui/components/Grid/generateEmptyRow";

const PANEL_WIDTH = 320;
const availableTables = ["orders", "products", "customers", "suppliers", "warehouses"];

const schemaNameMap: Record<string, string> = {
  orders: "orders",
  products: "products",
  customers: "customers",
  suppliers: "suppliers",
  warehouses: "warehouses",
};

const activeBtn =
  "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600";
const inactiveBtn =
  "bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-blue-950 dark:hover:text-blue-200 dark:hover:border-blue-400";
const baseBtn =
  "px-3 py-1 rounded border text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

function MobileRotatePrompt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      const isMobile =
        window.innerWidth <= 600 &&
        /Android|iPhone|iPod|iOS/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      setShow(isMobile && isPortrait);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <span className="text-6xl mb-4 animate-bounce">🔄</span>
      <div className="text-white text-2xl font-bold text-center">
        Please rotate your device
        <br />
        <span className="text-base font-normal text-gray-300">
          Landscape mode is required for this view on mobile.
        </span>
      </div>
    </div>
  );
}

export default function SheetsPage() {
  const [activeTableName, setActiveTableName] = useState<string>("orders");
  const [columns, setColumns] = useState<CustomColumnDef<unknown>[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(true);
  const [columnSettingsTarget, setColumnSettingsTarget] = useState<CustomColumnDef<unknown> | null>(null);
  const { showNavbar, setShowNavbar } = useNavbarVisibility();
  const { profile } = useProfile();
  const { settings } = useUserSettings();
  const userFontSize = settings.fontSize || "base";
  const userFontSizeIdx = Math.max(0, FONT_SIZE_PRESETS.findIndex((v) => v.value === userFontSize));
  const [fontSizeIdx, setFontSizeIdx] = useState(userFontSizeIdx);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setFontSizeIdx(userFontSizeIdx), [userFontSizeIdx]);

  useEffect(() => {
    if (!activeTableName) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const apiSlug = schemaNameMap[activeTableName] || activeTableName;
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/schema/${apiSlug}/`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error("Schema fetch failed", res.status);
          return;
        }

        const json = await res.json();

        const fixedCols: CustomColumnDef<unknown>[] = (json.columns || []).map((col: unknown, i: number) => {
          const column = col as CustomColumnDef<unknown>;
          return {
            ...column,
            id: column.id || column.accessorKey || `col_${i}_${Math.random().toString(36).slice(2, 8)}`,
          };
        });

        const enrichedCols = await enrichSchemaWithReferenceData(fixedCols);
        const populatedRows = (json.rows || []).length > 0
          ? json.rows
          : [{ ...generateEmptyRow(enrichedCols) }];

        setColumns(enrichedCols);
        setRows(populatedRows);
      } catch (error) {
        console.error("Error loading table data:", error);
      }
    };
    fetchData();
  }, [activeTableName]);

  const toolbarFontSize =
    mounted && FONT_SIZE_PRESETS[fontSizeIdx]?.fontSize
      ? FONT_SIZE_PRESETS[fontSizeIdx]?.fontSize
      : 14;

  return (
    <TableSettingsProvider fontSizeIdx={fontSizeIdx} setFontSizeIdx={setFontSizeIdx}>
      <MobileRotatePrompt />
      <RelationalWorkspaceLayout
        leftPanel={
          <TableSelectorPanel
            isOpen={isTablePanelOpen}
            tables={availableTables}
            activeTable={activeTableName}
            onSelectTable={setActiveTableName}
            onClose={() => setIsTablePanelOpen((v) => !v)}
            tableFontSize={FONT_SIZE_PRESETS[fontSizeIdx]?.value ?? "base"}
            isProUser={profile?.plan === "pro" || profile?.plan === "enterprise"}
            onAddTable={() => {
              // Replace with your logic or just a stub for now:
              console.log("Add table clicked!");
            }}
          />
        }
        rightPanel={
          isSettingsPanelOpen ? (
            <div style={{ width: PANEL_WIDTH }}>
              <ColumnSettingsPanel
                isOpen={isSettingsPanelOpen}
                column={columnSettingsTarget}
                onClose={() => setIsSettingsPanelOpen(false)}
                onUpdate={(updatedCol) => {
                  setColumns((cols) =>
                    cols.map((col) => (col.id === updatedCol.id ? updatedCol : col))
                  );
                  setIsSettingsPanelOpen(false);
                }}
              />
            </div>
          ) : (
            <div style={{ width: 0 }} />
          )
        }
      >
        <div className="flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsTablePanelOpen((v) => !v)}
              className={`${baseBtn} ${isTablePanelOpen ? activeBtn : inactiveBtn}`}
              title={isTablePanelOpen ? "Hide Tables Sidebar" : "Show Tables Sidebar"}
              style={{ fontSize: toolbarFontSize }}
            >
              📋 {isTablePanelOpen ? "Hide Tables" : "Show Tables"}
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowNavbar(!showNavbar)}
              className={`${baseBtn} ${!showNavbar ? activeBtn : inactiveBtn}`}
              title={showNavbar ? "Hide Navbar" : "Show Navbar"}
              style={{ fontSize: toolbarFontSize }}
            >
              {showNavbar ? "Hide Navbar" : "👁️ Show Navbar"}
            </button>
            <button
              onClick={() => setIsSettingsPanelOpen((v) => !v)}
              className={`${baseBtn} ${isSettingsPanelOpen ? activeBtn : inactiveBtn}`}
              title={isSettingsPanelOpen ? "Close Settings" : "Open Settings"}
              style={{ fontSize: toolbarFontSize }}
            >
              ⚙️ {isSettingsPanelOpen ? "Close Settings" : "Open Settings"}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <GridTable
              tableName={activeTableName}
              columns={columns}
              data={rows}
              onUpdateTable={() => {}} // stub
              onOpenSettingsPanel={(col) => {
                setColumnSettingsTarget(col);
                setIsSettingsPanelOpen(true);
              }}
              isSettingsPanelOpen={isSettingsPanelOpen}
              onRenameColumn={() => {}}        // stub, no lint error
              onReorderColumns={() => {}}      // stub, no lint error
              onAddColumn={() => {}}           // stub, no lint error
              onDeleteColumn={() => {}}        // stub, no lint error
            />
        </div>
      </RelationalWorkspaceLayout>
    </TableSettingsProvider>
  );
}
