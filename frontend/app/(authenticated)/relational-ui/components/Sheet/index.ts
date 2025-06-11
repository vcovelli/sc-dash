export interface Row {
  __rowId: string;
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
  formula?: string;
  currencyCode?: string;
}
