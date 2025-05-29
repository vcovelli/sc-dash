import { useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Row, CustomColumnDef } from "@/app/(authenticated)/relational-ui/lib/types";

export type ContextMenuAction =
  | "insertAbove"
  | "insertBelow"
  | "duplicateRow"
  | "deleteRow"
  | "insertColLeft"
  | "insertColRight"
  | "deleteCol"
  | "renameColumn"
  | "hideColumn"
  | "sortAsc"
  | "sortDesc"
  | "filterColumn";

export type ContextTarget = {
  rowIndex: number;
  colIndex: number;
};

interface UseContextMenuOptions {
  data: Row[];
  setData: React.Dispatch<React.SetStateAction<Row[]>>;
  rawColumns: CustomColumnDef<Row>[];
  setRawColumns: React.Dispatch<React.SetStateAction<CustomColumnDef<Row>[]>>;
  setRenameTarget: (target: { index: number; name: string }) => void;
  setRenamePosition: (pos: { x: number; y: number }) => void;
  setShowRenameModal: (show: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function useContextMenu({
  data,
  setData,
  rawColumns,
  setRawColumns,
  setRenameTarget,
  setRenamePosition,
  setShowRenameModal,
  containerRef,
}: UseContextMenuOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextTarget, setContextTarget] = useState<ContextTarget | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
      e.preventDefault();
      if (!scrollContainerRef.current) return;
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      setContextMenuPosition({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      });
      setContextTarget({ rowIndex, colIndex });
      setShowContextMenu(true);
    },
    []
  );

  const handleContextAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextTarget) return;
      const { rowIndex, colIndex } = contextTarget;

      const getColumnKey = () => rawColumns[colIndex - 1]?.accessorKey;

      switch (action) {
        case "insertAbove":
        case "insertBelow": {
          const insertAt = action === "insertAbove" ? rowIndex : rowIndex + 1;
          const newRow = { ...data[rowIndex], __rowId: uuidv4() };
          delete newRow.id; // Avoid duplicate IDs if necessary
          setData([...data.slice(0, insertAt), newRow, ...data.slice(insertAt)]);
          break;
        }

        case "duplicateRow": {
          const newRow = { ...data[rowIndex], __rowId: uuidv4() };
          delete newRow.id;
          setData([...data.slice(0, rowIndex + 1), newRow, ...data.slice(rowIndex + 1)]);
          break;
        }

        case "deleteRow":
          setData(data.filter((_, i) => i !== rowIndex));
          break;

        case "insertColLeft":
        case "insertColRight": {
          const newKey = `new_col_${Date.now()}`;
          const newCol: CustomColumnDef<Row> = {
            accessorKey: newKey,
            header: "New Column",
            type: "text",
          };
          const insertIdx = action === "insertColLeft" ? colIndex - 1 : colIndex;
          setRawColumns([
            ...rawColumns.slice(0, insertIdx),
            newCol,
            ...rawColumns.slice(insertIdx),
          ]);
          setData(data.map(row => ({ ...row, [newKey]: "" })));
          break;
        }

        case "deleteCol": {
          const key = getColumnKey();
          if (!key) return;
          setRawColumns(rawColumns.filter((_, i) => i !== colIndex - 1));
          setData(data.map(({ [key]: _, ...rest }) => ({ ...rest })));
          break;
        }

        case "renameColumn": {
          const col = rawColumns[colIndex - 1];
          if (!col || !containerRef.current) return;

          setRenameTarget({ index: colIndex, name: col.header as string });

          const cells = containerRef.current.querySelectorAll(".grid > div");
          const cell = cells[colIndex] as HTMLElement;

          if (cell) {
            const cellRect = cell.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setRenamePosition({
              x: cellRect.left - containerRect.left,
              y: cellRect.bottom - containerRect.top + 4,
            });
          }

          setShowRenameModal(true);
          break;
        }

        // Future case handlers...
        default:
          break;
      }

      setShowContextMenu(false);
    },
    [contextTarget, data, rawColumns, containerRef]
  );

  return {
    scrollContainerRef,
    showContextMenu,
    contextMenuPosition,
    contextTarget,
    handleContextMenu,
    handleContextAction,
    setShowContextMenu,
    setContextTarget,
  };
}
