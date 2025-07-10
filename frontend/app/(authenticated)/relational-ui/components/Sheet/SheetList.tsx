"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ColumnSettingsPanel from "@/app/(authenticated)/relational-ui/components/UX/ColumnSettingsPanel";
import GridTable from "@/app/(authenticated)/relational-ui/components/Grid/GridTable";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

interface Sheet {
  id: number;
  name: string;
  created_by: string | null;
}

interface SheetData {
  columns: CustomColumnDef<Row>[];
  data: Row[];
}

export default function SheetList() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetData, setSheetData] = useState<Record<number, SheetData>>({});
  const [loading, setLoading] = useState(true);

  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [columnSettingsTarget, setColumnSettingsTarget] = useState<CustomColumnDef<unknown> | null>(null);
  const [columnSettingsSheetId, setColumnSettingsSheetId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSheets = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/sheets/");
        setSheets(res.data);

        const allSheetData: Record<number, SheetData> = {};

        await Promise.all(
          res.data.map(async (sheet: Sheet) => {
            const schemaRes = await axios.get(`/api/schema/${sheet.name}/`);
            allSheetData[sheet.id] = {
              columns: schemaRes.data.columns,
              data: schemaRes.data.rows,
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

  // --- COLUMN OPERATIONS ---

  // Helper: Fetch latest schema and rows after any operation
  const fetchAndSetSheetSchema = useCallback(async (sheet: Sheet) => {
    const schemaRes = await axios.get(`/api/schema/${sheet.name}/`);
    setSheetData(prev => ({
      ...prev,
      [sheet.id]: {
        columns: schemaRes.data.columns,
        data: schemaRes.data.rows,
      }
    }));
  }, []);

  // Edit/update column (type, etc.)
  const handleUpdateColumn = useCallback(async (updatedCol: CustomColumnDef<unknown>) => {
    if (!columnSettingsSheetId) return;
    const sheet = sheets.find(s => s.id === columnSettingsSheetId);
    if (!sheet) return;

    setSheetData(prev => {
      const prevSheet = prev[columnSettingsSheetId];
      if (!prevSheet) return prev;
      const newColumns = prevSheet.columns.map(col =>
        col.accessorKey === updatedCol.accessorKey ? { ...col, ...updatedCol } : col
      );
      return {
        ...prev,
        [columnSettingsSheetId]: {
          ...prevSheet,
          columns: newColumns,
          data: prevSheet.data,
        }
      };
    });

    try {
      await axios.patch(`/api/schema/${sheet.name}/columns/${updatedCol.accessorKey}/`, {
        column: updatedCol
      });
    } catch (e) {
      console.error("Failed to update column:", e);
    }
    setIsSettingsPanelOpen(false);
  }, [columnSettingsSheetId, sheets]);

  // Rename column
  const handleRenameColumn = useCallback(async (sheetId: number, accessorKey: string, newHeader: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    try {
      await axios.patch(`/api/schema/${sheet.name}/columns/${accessorKey}/rename/`, { newName: newHeader });
      await fetchAndSetSheetSchema(sheet);
    } catch (e) {
      console.error("Failed to rename column:", e);
    }
  }, [sheets, fetchAndSetSheetSchema]);

  // Reorder columns (you’ll call this after drag-and-drop, pass the new array order)
  const handleReorderColumns = useCallback(async (sheetId: number, newColumns: CustomColumnDef<unknown>[]) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    try {
      await axios.patch(`/api/schema/${sheet.name}/columns/reorder/`, { columns: newColumns });
      await fetchAndSetSheetSchema(sheet);
    } catch (e) {
      console.error("Failed to reorder columns:", e);
    }
  }, [sheets, fetchAndSetSheetSchema]);

  // Add new column
  const handleAddColumn = useCallback(async (sheetId: number, newColumn: CustomColumnDef<unknown>) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    try {
      await axios.post(`/api/schema/${sheet.name}/columns/`, { column: newColumn });
      await fetchAndSetSheetSchema(sheet);
    } catch (e) {
      console.error("Failed to add column:", e);
    }
  }, [sheets, fetchAndSetSheetSchema]);

  // Delete column
  const handleDeleteColumn = useCallback(async (sheetId: number, accessorKey: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return;
    try {
      await axios.delete(`/api/schema/${sheet.name}/columns/${accessorKey}/`);
      await fetchAndSetSheetSchema(sheet);
    } catch (e) {
      console.error("Failed to delete column:", e);
    }
  }, [sheets, fetchAndSetSheetSchema]);

  // --- UI ---

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
                  // Add these props to wire up to the new handlers as needed:
                  onRenameColumn={(accessorKey, newHeader) => handleRenameColumn(sheet.id, accessorKey, newHeader)}
                  onReorderColumns={(newColumns) => handleReorderColumns(sheet.id, newColumns)}
                  onAddColumn={(newCol) => handleAddColumn(sheet.id, newCol)}
                  onDeleteColumn={(accessorKey) => handleDeleteColumn(sheet.id, accessorKey)}
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
