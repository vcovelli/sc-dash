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
  | "email"
  | "formula";

// More strongly typed choice/reference option shape
export interface Option {
  id: string;
  name: string;
  isAddNew?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CustomColumnDef<TData = Row> {
  accessorKey: string;
  header: string;
  type: ColumnDataType;
  id?: string;
  choices?: string[] | Option[];
  referenceData?: Option[];
  referenceTable?: string;
  referenceDisplayField?: string;
  formula?: string;
  currencyCode?: string;

  width?: number;
  isVisible?: boolean;
  isEditable?: boolean;

  onAddChoice?: (newName: string, color?: string) => Promise<Option | null> | Option | null;
  onAddReference?: (newName: string) => Promise<Option | null> | Option | null;
}
