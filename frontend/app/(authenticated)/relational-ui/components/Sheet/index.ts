export interface Row {
  __rowId: number;
  [key: string]: unknown;
}

export type ColumnDataType =
  | "text"
  | "choice"
  | "reference"
  | "date"
  | "boolean"
  | "currency"
  | "number"
  | "link"
  | "attachment"
  | "formula";

// More strongly typed choice/reference option shape
export interface Option {
  id: string;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CustomColumnDef<TData = Row> {
  accessorKey: string;
  header: string;
  type: ColumnDataType;
  id?: string;
  choices?: string[] | Option[];
  referenceData?: Option[];
  reference_table?: string;
  formula?: string;
  currencyCode?: string;

  onAddChoice?: (newName: string, color?: string) => Promise<Option | null> | Option | null;
  onAddReference?: (newName: string) => Promise<Option | null> | Option | null;
}
