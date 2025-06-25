import { CustomColumnDef } from "@/app/(authenticated)/relational-ui/components/Sheet";
import { Row } from "@/app/(authenticated)/relational-ui/components/Sheet";

export function generateEmptyRow(columns: CustomColumnDef<unknown>[]): Row {
  const empty: Row = { __rowId: `row_${crypto.randomUUID()}` };

  for (const col of columns) {
    empty[col.accessorKey] = null;
  }

  return empty;
}
