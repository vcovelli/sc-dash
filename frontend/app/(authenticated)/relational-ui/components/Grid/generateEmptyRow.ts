import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

export function generateEmptyRow(columns: CustomColumnDef<unknown>[]): Row {
  const empty: Row = { __rowId: Date.now() + Math.floor(Math.random() * 10000) };

  for (const col of columns) {
    empty[col.accessorKey] = null;
  }

  return empty;
}
