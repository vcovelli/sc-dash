import { useRef, useState, useCallback } from "react";
import { Row, CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";

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

const MENU_WIDTH = 256;
const MENU_HEIGHT = 320;
const MENU_MARGIN = 8;

function getSafePosition(x: number, y: number) {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  let newX = x;
  let newY = y;
  if (x + MENU_WIDTH + MENU_MARGIN > winW) {
    newX = winW - MENU_WIDTH - MENU_MARGIN;
  }
  if (y + MENU_HEIGHT + MENU_MARGIN > winH) {
    newY = winH - MENU_HEIGHT - MENU_MARGIN;
  }
  return {
    x: Math.max(newX, MENU_MARGIN),
    y: Math.max(newY, MENU_MARGIN),
  };
}

function generateBlankRow(columns: CustomColumnDef<Row>[]): Row {
  const newRow: Row = { __rowId: Date.now() + Math.floor(Math.random() * 10000) };
  for (const col of columns) {
    const key = col.accessorKey;
    const type = col.type?.toLowerCase();

    switch (type) {
      case "number":
      case "currency":
        newRow[key] = null;
        break;
      case "boolean":
        newRow[key] = false;
        break;
      case "choice_list":
      case "reference_list":
        newRow[key] = [];
        break;
      case "choice":
      case "reference":
        newRow[key] = null;
        break;
      default:
        newRow[key] = "";
    }
  }
  return newRow;
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
  const longPressTimeout = useRef<number | null>(null);

  const openMenuAt = useCallback((clientX: number, clientY: number, rowIndex: number, colIndex: number) => {
    const safePos = getSafePosition(clientX, clientY);
    setContextMenuPosition(safePos);
    setContextTarget({ rowIndex, colIndex });
    setShowContextMenu(true);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
      e.preventDefault();
      openMenuAt(e.clientX, e.clientY, rowIndex, colIndex);
    },
    [openMenuAt]
  );

  const getTouchHandlers = (rowIndex: number, colIndex: number) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      longPressTimeout.current = window.setTimeout(() => {
        const touch = e.touches[0];
        openMenuAt(touch.clientX, touch.clientY, rowIndex, colIndex);
      }, 600);
    },
    onTouchEnd: () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    },
    onTouchMove: () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    },
    onTouchCancel: () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    },
  });

  const handleContextAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextTarget) return;
      const { rowIndex, colIndex } = contextTarget;

      const getColumnKey = () => rawColumns[colIndex - 1]?.accessorKey;

      switch (action) {
        case "insertAbove":
        case "insertBelow": {
          const newRow = generateBlankRow(rawColumns);
          const insertAt = action === "insertAbove" ? rowIndex : rowIndex + 1;
          setData([...data.slice(0, insertAt), newRow, ...data.slice(insertAt)]);
          break;
        }

        case "duplicateRow": {
          const original = data[rowIndex];
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __rowId: _, ...rest } = original;
          const clone = { ...rest, __rowId: Date.now() + Math.floor(Math.random() * 10000) };
          setData([...data.slice(0, rowIndex + 1), clone, ...data.slice(rowIndex + 1)]);
          break;
        }

        case "deleteRow":
          setData(data.filter((_, i) => i !== rowIndex));
          break;

        case "insertColLeft":
        case "insertColRight": {
          if (colIndex === 0) return;

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
          setRawColumns(rawColumns.filter((_col, i) => i !== colIndex - 1));
          setData(data.map(row => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [key]: _, ...rest } = row;
            return { ...rest, __rowId: row.__rowId };
          }));
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

        default:
          break;
      }

      setShowContextMenu(false);
    },
    [contextTarget, data, rawColumns, containerRef, setData, setRawColumns, setRenamePosition, setRenameTarget, setShowRenameModal]
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
    openMenuAt,
    getTouchHandlers,
  };
}
