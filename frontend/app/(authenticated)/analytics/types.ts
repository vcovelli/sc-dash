export type WidgetType = "bar" | "line" | "pie" | "table";

export interface DataSourceRef {
  table: string;    // for now, all come from same table (MVP)
  field: string;
}

export interface BarChartSettings {
  table: string;                // table name for this chart
  xField: string;               // column name for x-axis
  yFields: string[];            // column names for y-axes (bars)
  barColors?: string[];
  showLegend?: boolean;
  stacked?: boolean;
}

export interface WidgetConfig<T = any> {
  id: string;
  type: WidgetType;
  title: string;
  data?: any[];    // You can inject data directly for MVP, later fetch from DB based on table
  settings: T;
}
