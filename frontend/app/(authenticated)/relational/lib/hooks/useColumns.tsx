import { ColumnDef } from "@tanstack/react-table";
import EditableCell from "@relational/components/Grid/EditableCell";
import { CustomColumnDef, Row } from "@relational/lib/types";

export function buildColumnDefs(
  editingCell: { rowIndex: number; colIndex: number } | null,
  onSave: (id: string, key: string, value: any) => void,
  clearEdit: () => void,
  setEditingCell: (cell: { rowIndex: number; colIndex: number }) => void,
  schema: CustomColumnDef<Row>[]
): ColumnDef<Row>[] {
  return schema
    .filter(col => col.accessorKey !== "__rowId")
    .map((col, colIndex) => ({
      accessorKey: col.accessorKey,
      header: col.header,
      id: col.accessorKey,
      size: 160,
      minSize: 60,
      maxSize: 500,
      enableResizing: true,
      cell: ({ getValue, row }) => {
        const rowIndex = row.index;
        const actualColIndex = colIndex;

        return (
          <EditableCell
            value={getValue()}
            row={row.original}
            rowId={row.original.__rowId}
            column={col}
            onSave={onSave}
            editing={
              editingCell?.rowIndex === rowIndex &&
              editingCell?.colIndex === actualColIndex
            }
            onStartEdit={() =>
              setEditingCell({ rowIndex, colIndex: actualColIndex })
            }
            onEditComplete={clearEdit}
          />
        );
      },
    }));
}
