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
  | "formula";

// More strongly typed choice/reference option shape
export interface Option {
  id: string;
  name: string;
}

export interface CustomColumnDef<TData = Row> {
  accessorKey: string;
  header: string;
  type: ColumnDataType;

  // For "choice" type columns
  choices?: string[] | Option[];

  // For "reference" type columns
  referenceData?: Option[];

  // For "formula" type columns
  formula?: string;
}
