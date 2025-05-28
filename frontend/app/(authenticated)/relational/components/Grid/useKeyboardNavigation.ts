import { useEffect, useRef } from "react";
import { CustomColumnDef, Row } from "@/types";

type Props = {
  showRenameModal: boolean;
  focusedCell: { rowIndex: number; colIndex: number } | null;
  setFocusedCell: (cell: { rowIndex: number; colIndex: number } | null) => void;
  editingCell: { rowIndex: number; colIndex: number } | null;
  setEditingCell: (cell: { rowIndex: number; colIndex: number } | null) => void;
  data: Row[];
  rawColumns: CustomColumnDef<Row>[];
  columnDefs: ReturnType<typeof import("@/hooks/useColumns").buildColumnDefs>;
};

export default function useKeyboardNavigation({
  showRenameModal,
  focusedCell,
  setFocusedCell,
  editingCell,
  setEditingCell,
  data,
  rawColumns,
  columnDefs,
}: Props) {
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - lastKeyTimeRef.current < 16) return; // throttle ~60fps
      lastKeyTimeRef.current = now;

      const active = document.activeElement as HTMLElement | null;

      // Block if interacting with modal or input-like UI
      if (
        showRenameModal ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.isContentEditable ||
        active?.closest(".rename-modal") ||
        active?.closest("[data-radix-popper-content-wrapper]")
      ) {
        return;
      }

      if (!focusedCell) return;

      const { rowIndex, colIndex } = focusedCell;
      const maxRow = data.length - 1;
      const maxCol = columnDefs.length - 1;

      const updateFocusIfChanged = (newRow: number, newCol: number) => {
        if (
          !focusedCell ||
          focusedCell.rowIndex !== newRow ||
          focusedCell.colIndex !== newCol
        ) {
          setFocusedCell({ rowIndex: newRow, colIndex: newCol });
        }
      };

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          updateFocusIfChanged(Math.max(0, rowIndex - 1), colIndex);
          break;

        case "ArrowDown":
          e.preventDefault();
          updateFocusIfChanged(Math.min(maxRow, rowIndex + 1), colIndex);
          break;

        case "ArrowLeft":
          e.preventDefault();
          updateFocusIfChanged(rowIndex, Math.max(0, colIndex - 1));
          break;

        case "ArrowRight":
          e.preventDefault();
          updateFocusIfChanged(rowIndex, Math.min(maxCol, colIndex + 1));
          break;

        case "Enter": {
          e.preventDefault();
          const columnType = rawColumns[colIndex - 1]?.type;

          if (columnType === "choice" || columnType === "reference") {
            if (
              editingCell?.rowIndex === rowIndex &&
              editingCell?.colIndex === colIndex
            ) {
              // Defer focus to avoid blocking event loop
              setTimeout(() => {
                const input = document.querySelector("[data-autofocus-select]") as HTMLElement;
                input?.focus();
                input?.click();
              }, 0);
            } else {
              setEditingCell({ rowIndex, colIndex });
            }
          } else {
            setEditingCell({ rowIndex, colIndex });
          }
          break;
        }

        case "Escape":
          e.preventDefault();
          setFocusedCell(null);
          setEditingCell(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showRenameModal,
    focusedCell,
    editingCell,
    columnDefs.length,
    data.length,
    rawColumns,
    setFocusedCell,
    setEditingCell,
  ]);
}
