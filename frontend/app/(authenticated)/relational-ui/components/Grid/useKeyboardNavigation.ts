import { useEffect, useRef } from "react";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/lib/types";

type Props = {
  showRenameModal: boolean;
  focusedCell: { rowIndex: number; colIndex: number } | null;
  setFocusedCell: (cell: { rowIndex: number; colIndex: number } | null) => void;
  editingCell: { rowIndex: number; colIndex: number } | null;
  setEditingCell: (cell: { rowIndex: number; colIndex: number } | null) => void;
  data: Row[];
  rawColumns: CustomColumnDef<Row>[] | undefined;
  columnDefs: ReturnType<typeof import("@/app/(authenticated)/relational-ui/lib/hooks/useColumns").buildColumnDefs>;
};

export default function useKeyboardNavigation({
  showRenameModal,
  focusedCell,
  setFocusedCell,
  editingCell,
  setEditingCell,
  data,
  rawColumns = [],
  columnDefs,
}: Props) {
  const rafRef = useRef<number | null>(null);

  const shouldBlockInput = () => {
    const active = document.activeElement as HTMLElement | null;
    return (
      showRenameModal ||
      active?.tagName === "INPUT" ||
      active?.tagName === "TEXTAREA" ||
      active?.isContentEditable ||
      active?.closest(".rename-modal") ||
      active?.closest("[data-radix-popper-content-wrapper]") ||
      document.querySelector(".datepicker-modal-active")
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        if (!focusedCell || shouldBlockInput()) return;

        const { rowIndex, colIndex } = focusedCell;
        const maxRow = data.length - 1;
        const maxCol = columnDefs.length - 1;

        const updateFocusIfChanged = (newRow: number, newCol: number) => {
          if (
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

          case "Tab":
            e.preventDefault();
            updateFocusIfChanged(
              rowIndex,
              e.shiftKey ? Math.max(0, colIndex - 1) : Math.min(maxCol, colIndex + 1)
            );
            break;

          case "Enter": {
            e.preventDefault();

            const isEditing =
              editingCell?.rowIndex === rowIndex &&
              editingCell?.colIndex === colIndex;

            const column = rawColumns?.[colIndex];
            const type = column?.type ?? "";

            if (!isEditing) {
              // Start editing
              setEditingCell({ rowIndex, colIndex });

              if (["choice", "reference"].includes(type)) {
                setTimeout(() => {
                  const el = document.querySelector("[data-autofocus-select]") as HTMLElement;
                  el?.focus();
                  el?.click();
                }, 0);
              }
            } else {
              // Blur input to commit save
              const active = document.activeElement as HTMLElement;
              active?.blur();

              // Move to the cell below
              const nextRow = Math.min(data.length - 1, rowIndex + 1);
              setFocusedCell({ rowIndex: nextRow, colIndex });
              setEditingCell(null);
            }
            break;
          }

          case "Escape":
            e.preventDefault();
            setFocusedCell(null);
            setEditingCell(null);
            break;
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
