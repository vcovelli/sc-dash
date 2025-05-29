import { ColumnDef } from "@tanstack/react-table";
import EditableCell from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/lib/types";

export function buildColumnDefs(
  editingCell: { rowIndex: number; colIndex: number } | null,
  onSave: (id: string, key: string, value: any) => void,
  clearEdit: () => void,
  setEditingCell: (cell: { rowIndex: number; colIndex: number }) => void,
  schema: CustomColumnDef<Row>[]
): ColumnDef<Row>[] {
  return schema
    .filter(col => col.accessorKey !== "__rowId")
    .map((col, colIndex): ColumnDef<Row> => ({
      accessorKey: col.accessorKey,
      header: col.header,
      id: col.id || col.accessorKey,
      size: 160,
      minSize: 60,
      maxSize: 500,
      enableResizing: true,
      cell: ({ row, getValue }) => {
        const isEditing =
          editingCell?.rowIndex === row.index &&
          editingCell?.colIndex === colIndex;

        return (
          <EditableCell
            key={`${row.id}-${col.accessorKey}`}
            value={getValue()}
            row={row.original}
            rowId={row.original.__rowId}
            column={col}
            onSave={onSave}
            editing={isEditing}
            onStartEdit={() => setEditingCell({ rowIndex: row.index, colIndex })}
            onEditComplete={clearEdit}
          />
        );
      },
    }));
}
