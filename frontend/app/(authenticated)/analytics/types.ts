// types.ts

export type WidgetType = "bar" | "line" | "pie" | "table" | "area" | "scatter" | "radar" | "composed";

// --- Chart Settings Types (with discriminated 'type') ---

export interface BarChartSettings {
  type: "bar";
  table: string;
  xField: string;
  yFields: string[];
  barColors?: string[];
  showLegend?: boolean;
  stacked?: boolean;
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  yScale?: "linear" | "log" | "auto";
}

export interface LineChartSettings {
  type: "line";
  table: string;
  xField: string;
  yFields: string[];
  lineColors?: string[];
  showLegend?: boolean;
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  yScale?: "linear" | "log" | "auto";
}

export interface PieChartSettings {
  type: "pie";
  table: string;
  xField: string;
  yFields: string[];
  pieColors?: string[];
  showLegend?: boolean;
  // Add other pie-specific options here
}

export interface TableChartSettings {
  type: "table";
  table: string;
  xField: string;
  yFields: string[];
  // Table charts do **not** get barColors, showLegend, etc
}

export interface AreaChartSettings {
  type: "area";
  table: string;
  xField: string;
  yFields: string[];
  areaColors?: string[];
  showLegend?: boolean;
  stacked?: boolean;
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  yScale?: "linear" | "log" | "auto";
  fillOpacity?: number;
}

export interface ScatterChartSettings {
  type: "scatter";
  table: string;
  xField: string;
  yFields: string[];
  scatterColors?: string[];
  showLegend?: boolean;
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  yScale?: "linear" | "log" | "auto";
  xScale?: "linear" | "log" | "auto";
  dotSize?: number;
}

export interface RadarChartSettings {
  type: "radar";
  table: string;
  xField: string;
  yFields: string[];
  radarColors?: string[];
  showLegend?: boolean;
  fillOpacity?: number;
  strokeWidth?: number;
}

export interface ComposedChartSettings {
  type: "composed";
  table: string;
  xField: string;
  yFields: string[];
  chartTypes: ("bar" | "line" | "area")[];  // Which chart type for each yField
  colors?: string[];
  showLegend?: boolean;
  yMin?: number;
  yMax?: number;
  xMin?: number | string;
  xMax?: number | string;
  yScale?: "linear" | "log" | "auto";
}

// --- Union of all widget settings (discriminated union!) ---
export type AllWidgetSettings =
  | BarChartSettings
  | LineChartSettings
  | PieChartSettings
  | TableChartSettings
  | AreaChartSettings
  | ScatterChartSettings
  | RadarChartSettings
  | ComposedChartSettings;

// --- WidgetConfig generic, defaulting to AllWidgetSettings ---
export interface WidgetConfig<T = AllWidgetSettings> {
  id: string;
  type: WidgetType;
  title: string;
  data?: unknown[]; // Optional: for injected/mock data
  settings: T;
  sample?: boolean;
}

export interface TableMeta {
  name: string;
  columns: { name: string; type: string }[];
}

export type DataRow = {
  name: string;
  [key: string]: string | number | undefined;
};