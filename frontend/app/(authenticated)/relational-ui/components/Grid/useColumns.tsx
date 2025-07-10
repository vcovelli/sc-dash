import { ColumnDef } from "@tanstack/react-table";
import EditableCell from "@/app/(authenticated)/relational-ui/components/Grid/EditableCell";
import { CustomColumnDef, Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

export function buildColumnDefs(
  editingCell: { rowIndex: number; colIndex: number } | null,
  onSave: (id: number, key: string, value: unknown) => void,
  clearEdit: () => void,
  setEditingCell: (cell: { rowIndex: number; colIndex: number }) => void,
  schema: CustomColumnDef<Row>[],
  userCurrencyCode: string
): ColumnDef<Row>[] {
  return schema
    .filter(col => col.accessorKey !== "__rowId")
    .map((col, colIndex): ColumnDef<Row> => {
      const currencyCodeToUse =
        col.type === "currency" && col.currencyCode?.trim()
          ? col.currencyCode
          : userCurrencyCode;

      return {
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

          const columnForCell = { ...col, currencyCode: currencyCodeToUse };

          return (
            <EditableCell
              value={getValue()}
              row={row.original}
              rowId={row.original.__rowId}
              column={columnForCell}
              onSave={onSave}
              editing={isEditing}
              onStartEdit={() => setEditingCell({ rowIndex: row.index, colIndex })}
              onEditComplete={clearEdit}
            />
          );
        },
      };
    });
}

