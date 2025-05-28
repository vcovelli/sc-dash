export interface Row {
  __rowId: string;
  [key: string]: any;
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
  | "formula"; // Add all your types here

export interface CustomColumnDef<TData> {
  accessorKey: string;
  header: string;
  type: ColumnDataType;
  choices?: string[] | { id: string; name: string }[];
  referenceData?: { id: string; name: string }[];
  formula?: string; // Optional field for computed columns
}
