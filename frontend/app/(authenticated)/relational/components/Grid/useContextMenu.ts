import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Row, CustomColumnDef } from "@relational/lib/types";

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
  containerRef: React.RefObject<HTMLDivElement | null>
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

  const handleContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    if (!scrollContainerRef.current) return;
    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    setContextMenuPosition({ x: relativeX, y: relativeY });
    setContextTarget({ rowIndex, colIndex });
    setShowContextMenu(true);
  };

  const handleContextAction = (action: ContextMenuAction) => {
    if (!contextTarget) return;

    const { rowIndex, colIndex } = contextTarget;

    switch (action) {
      case "insertAbove":
      case "insertBelow":
      case "duplicateRow": {
        const newRow = { ...data[rowIndex], __rowId: uuidv4() };
        const insertAt = action === "insertAbove" ? rowIndex : rowIndex + 1;
        setData([...data.slice(0, insertAt), newRow, ...data.slice(insertAt)]);
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
        const idx = action === "insertColLeft" ? colIndex - 1 : colIndex;
        setRawColumns([
          ...rawColumns.slice(0, idx),
          newCol,
          ...rawColumns.slice(idx),
        ]);
        setData(data.map((row) => ({ ...row, [newKey]: "" })));
        break;
      }
      case "deleteCol": {
        const key = rawColumns[colIndex - 1]?.accessorKey;
        if (!key) return;
        setRawColumns(rawColumns.filter((_, i) => i !== colIndex - 1));
        setData(data.map((row) => {
          const { [key]: _, ...rest } = row;
          return { ...rest, __rowId: row.__rowId };
        }));
        break;
      }
      case "renameColumn": {
        const col = rawColumns[colIndex - 1];
        if (!col) return;
        setRenameTarget({ index: colIndex, name: col.header as string });
        if (containerRef.current) {
          const cell = containerRef.current.querySelectorAll(".grid > div")[
            colIndex
          ] as HTMLElement;
          if (cell) {
            const rect = cell.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setRenamePosition({
              x: rect.left - containerRect.left,
              y: rect.bottom - containerRect.top + 4,
            });
          }
        }
        setShowRenameModal(true);
        break;
      }
    }

    setShowContextMenu(false);
  };

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
