export type RecentFile = {
  file_name: string;
  row_count?: number;
  uploaded_at?: string; // or Date, but string is usually what you get from API
};