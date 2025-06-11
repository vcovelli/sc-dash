import { useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
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
  newX = Math.max(newX, MENU_MARGIN);
  newY = Math.max(newY, MENU_MARGIN);
  return { x: newX, y: newY };
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

  // -- Long press state for mobile touch --
  const longPressTimeout = useRef<number | null>(null);

  // Opens the menu at the specified screen coords
  const openMenuAt = useCallback(
    (clientX: number, clientY: number, rowIndex: number, colIndex: number) => {
      const safePos = getSafePosition(clientX, clientY);
      setContextMenuPosition(safePos);
      setContextTarget({ rowIndex, colIndex });
      setShowContextMenu(true);
    },
    []
  );

  // For mouse (right click)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
      e.preventDefault();
      openMenuAt(e.clientX, e.clientY, rowIndex, colIndex);
    },
    [openMenuAt]
  );

  const getTouchHandlers = (rowIndex: number, colIndex: number) => ({
    onTouchStart: (e: React.TouchEvent) => {
      // iOS: prevent text selection/callout right away
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
      // If finger moves, cancel long-press!
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    },
    onTouchCancel: () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    },
  });

  // Actions
  const handleContextAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextTarget) return;
      const { rowIndex, colIndex } = contextTarget;

      const getColumnKey = () => rawColumns[colIndex - 1]?.accessorKey;

      switch (action) {
        case "insertAbove":
        case "insertBelow": {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __rowId, ...rest } = data[rowIndex];
          const insertAt = action === "insertAbove" ? rowIndex : rowIndex + 1;
          const newRow: Row = { ...rest, __rowId: uuidv4() };
          setData([...data.slice(0, insertAt), newRow, ...data.slice(insertAt)]);
          break;
        }
        case "duplicateRow": {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { __rowId, ...rest } = data[rowIndex];
          const newRow: Row = { ...rest, __rowId: uuidv4() };
          setData([...data.slice(0, rowIndex + 1), newRow, ...data.slice(rowIndex + 1)]);
          break;
        }
        case "deleteRow":
          setData(data.filter((__, i) => i !== rowIndex));
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

          const insertIdx = 
            action === "insertColLeft"
              ? colIndex - 1
              : colIndex;
              
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
            const { [key]: _, __rowId, ...rest } = row;
            return { ...rest, __rowId };
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
        // Future case handlers...
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