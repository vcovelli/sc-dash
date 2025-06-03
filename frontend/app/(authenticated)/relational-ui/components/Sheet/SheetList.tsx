"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ColumnSettingsPanel from "@/app/(authenticated)/relational-ui/components/UX/ColumnSettingsPanel";
import GridTable from "@/app/(authenticated)/relational-ui/components/Grid/GridTable";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface Sheet {
  id: string;
  name: string;
  created_by: string | null;
}

interface SheetData {
  columns: CustomColumnDef<Row>[];
  data: Row[];
}

export default function SheetList() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetData, setSheetData] = useState<Record<string, SheetData>>({});
  const [loading, setLoading] = useState(true);

  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [columnSettingsTarget, setColumnSettingsTarget] = useState<CustomColumnDef<any> | null>(null);
  const [columnSettingsSheetId, setColumnSettingsSheetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheets = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://backend:8000/api/sheets/");
        setSheets(res.data);

        // Fetch columns and data for each sheet
        const allSheetData: Record<string, SheetData> = {};

        await Promise.all(
          res.data.map(async (sheet: Sheet) => {
            const [colsRes, dataRes] = await Promise.all([
              axios.get(`http://backend:8000/api/sheets/${sheet.id}/columns/`),
              axios.get(`http://backend:8000/api/sheets/${sheet.id}/rows/`)
            ]);
            allSheetData[sheet.id] = {
              columns: colsRes.data,
              data: dataRes.data,
            };
          })
        );

        setSheetData(allSheetData);
      } catch (error) {
        console.error("Failed to fetch sheets:", error);
      }
      setLoading(false);
    };

    fetchSheets();
  }, []);

  // Update a column's properties (e.g., type, currencyCode, header)
  const handleUpdateColumn = useCallback((updatedCol: CustomColumnDef<any>) => {
    if (!columnSettingsSheetId) {
      console.warn("[handleUpdateColumn] No sheet selected");
      setIsSettingsPanelOpen(false);
      return;
    }
    console.log("[handleUpdateColumn] Updating column:", updatedCol, "for sheet:", columnSettingsSheetId);

    setSheetData((prev) => {
      const prevSheet = prev[columnSettingsSheetId];
      if (!prevSheet) {
        console.warn("[handleUpdateColumn] No previous sheet data for:", columnSettingsSheetId);
        return prev;
      }

      const newColumns = prevSheet.columns.map(col =>
        col.accessorKey === updatedCol.accessorKey ? { ...col, ...updatedCol } : col
      );

      console.log("[handleUpdateColumn] New columns array:", newColumns);

      return {
        ...prev,
        [columnSettingsSheetId]: {
          ...prevSheet,
          columns: newColumns,
          data: prevSheet.data,
        }
      };
    });

    setIsSettingsPanelOpen(false);
  }, [columnSettingsSheetId]);

  return (
    <div className="relative p-8">
      <h1 className="text-2xl font-bold mb-6">🧾 Relational Spreadsheet</h1>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <p className="text-lg font-semibold">Name: {sheet.name}</p>
              <p className="text-sm text-gray-500">
                Created By: {sheet.created_by ?? "Anonymous"}
              </p>
              <div className="mt-4">
                <GridTable
                  tableName={sheet.name}
                  columns={sheetData[sheet.id]?.columns || []}
                  data={sheetData[sheet.id]?.data || []}
                  onUpdateTable={(name, updated) => {
                    setSheetData((prev) => ({
                      ...prev,
                      [sheet.id]: {
                        ...prev[sheet.id],
                        ...updated,
                      },
                    }));
                  }}
                  isSettingsPanelOpen={isSettingsPanelOpen}
                  onOpenSettingsPanel={(col) => {
                    setColumnSettingsTarget(col);
                    setColumnSettingsSheetId(sheet.id);
                    setIsSettingsPanelOpen(true);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ColumnSettingsPanel
        isOpen={isSettingsPanelOpen}
        column={columnSettingsTarget}
        onClose={() => setIsSettingsPanelOpen(false)}
        onUpdate={handleUpdateColumn}
      />
    </div>
  );
}
