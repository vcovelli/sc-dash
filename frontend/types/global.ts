export type UploadedFile = {
  id: number;                     // file.id
  file_name: string;              // file.file_name
  file_size: number;              // file.file_size
  row_count?: number;             // file.row_count (optional)
  uploaded_by?: string;           // file.uploaded_by (optional)
  uploaded_at: string;            // file.uploaded_at (ISO date string)
  status?: string;                // file.status (optional)
  minio_path?: string;            // file.minio_path (optional)
};