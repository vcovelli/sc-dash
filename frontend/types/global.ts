export type UploadedFile = {
  id: number;                     // file.id
  file_name: string;              // file.file_name
  file_size: number;              // file.file_size
  row_count?: number;             // file.row_count (optional)
  uploaded_by?: string;           // file.uploaded_by (optional)
  uploaded_at: string;            // file.uploaded_at (ISO date string)
  status?: string;                // file.status (optional)
  minio_path?: string;            // file.minio_path (optional)
  
  // System columns from AuditableModel
  created_by?: string;            // file.created_by (system column)
  modified_by?: string;           // file.modified_by (system column)
  created_at?: string;            // file.created_at (system column)
  modified_at?: string;           // file.modified_at (system column)
  version?: number;               // file.version (system column)
};