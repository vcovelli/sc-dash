"use client";

import React, { useState, useEffect } from "react";
import RelationalWorkspaceLayout from "@/app/(authenticated)/relational-ui/lib/layouts/RelationalWorkspaceLayout";
import GridTable from "@/app/(authenticated)/relational-ui/components/Grid/GridTable";
import ColumnSettingsPanel from "@/app/(authenticated)/relational-ui/components/UI/ColumnSettingsPanel";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/lib/types";

const PANEL_WIDTH = 320;
const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 48;

const availableTables = ["orders", "products", "customers", "suppliers", "warehouses"];

export default function SheetsPage() {
  const [activeTableName, setActiveTableName] = useState<string>("orders");
  const [columns, setColumns] = useState<CustomColumnDef<any>[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isTablePanelOpen, setIsTablePanelOpen] = useState(true);
  const [columnSettingsTarget, setColumnSettingsTarget] = useState<CustomColumnDef<any> | null>(null);
  const [zebraStriping, setZebraStriping] = useState(true);

  useEffect(() => {
    if (!activeTableName) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/schema/${activeTableName}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        setColumns(json.columns || []);
        setRows(json.rows || []);
      } catch (error) {
        console.error("Error loading table data:", error);
      }
    };
    fetchData();
  }, [activeTableName]);

  return (
    <RelationalWorkspaceLayout
      leftPanel={
        <div
          className="h-full"
          style={{ width: isTablePanelOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED }}
        >
          {isTablePanelOpen ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">📁 Tables</h2>
                <button onClick={() => setIsTablePanelOpen(false)} className="text-gray-600 hover:text-black">✕</button>
              </div>
              <ul className="p-4 space-y-2 overflow-auto">
                {availableTables.map((table) => (
                  <button
                    key={table}
                    onClick={() => setActiveTableName(table)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      table === activeTableName
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {table.charAt(0).toUpperCase() + table.slice(1)}
                  </button>
                ))}
              </ul>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center pt-2">
              <span className="text-xs text-gray-400 mb-1">▶</span>
            </div>
          )}
        </div>
      }
      rightPanel={
        isSettingsPanelOpen ? (
          <div style={{ width: PANEL_WIDTH }}>
            <ColumnSettingsPanel
              isOpen={isSettingsPanelOpen}
              column={columnSettingsTarget}
              onClose={() => setIsSettingsPanelOpen(false)}
              onUpdate={() => setIsSettingsPanelOpen(false)}
              zebraStriping={zebraStriping}
              onToggleZebra={() => setZebraStriping((z) => !z)}
            />
          </div>
        ) : (
          <div style={{ width: 0 }} />
        )
      }
    >
      {/* Top Toolbar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white border-b">
        <button
          onClick={() => setIsTablePanelOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
        >
          <span className="text-base">📁</span>
          {isTablePanelOpen ? "Show Less Tables" : "Show All Tables"}
        </button>
        <button
          onClick={() => setIsSettingsPanelOpen((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition"
        >
          <span className="text-base">⚙</span>
          {isSettingsPanelOpen ? "Close Settings" : "Open Settings"}
        </button>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-auto">
        <GridTable
          tableName={activeTableName}
          columns={columns}
          data={rows}
          onUpdateTable={() => {}}
          onOpenSettingsPanel={(col) => {
            setColumnSettingsTarget(col);
            setIsSettingsPanelOpen(true);
          }}
          isSettingsPanelOpen={isSettingsPanelOpen}
        />
      </div>
    </RelationalWorkspaceLayout>
  );
}
