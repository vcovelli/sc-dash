"use client";

import { useUploadedFiles } from "../hooks/useUploadedFiles";
import axios from "axios";
import { useState } from "react";

export const UploadedFilesTable = () => {
  const { files, loading, refetch } = useUploadedFiles();
  const [ingesting, setIngesting] = useState<number | null>(null);

  const startIngestion = async (fileId: number) => {
    try {
      setIngesting(fileId);
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/start-ingestion/`,
        { file_id: fileId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      setTimeout(refetch, 2000);
    } catch (err) {
      console.error("Ingestion error:", err);
      alert("Failed to start ingestion.");
    } finally {
      setIngesting(null);
    }
  };

  const getReadableSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    else return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getDownloadUrl = async (fileId: number) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/file-download/${fileId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      return res.data.url;
    } catch (err) {
      console.error("Failed to get download URL:", err);
      return null;
    }
  };

  if (loading) return <p>Loading files...</p>;
  if (!files.length) return <p>No uploaded files found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2 border-b">Filename</th>
            <th className="px-4 py-2 border-b">Size</th>
            <th className="px-4 py-2 border-b">Rows</th>
            <th className="px-4 py-2 border-b">Uploaded By</th>
            <th className="px-4 py-2 border-b">Uploaded At</th>
            <th className="px-4 py-2 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{file.file_name}</td>
              <td className="px-4 py-2 border-b">
                {file.file_size ? getReadableSize(file.file_size) : "Unknown"}
              </td>
              <td className="px-4 py-2 border-b">{file.row_count ?? "-"}</td>
              <td className="px-4 py-2 border-b">{file.uploaded_by}</td>
              <td className="px-4 py-2 border-b">
                {new Date(file.uploaded_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 border-b">
                {file.status === "success" && file.minio_path ? (
                  <button
                    onClick={async () => {
                      const url = await getDownloadUrl(file.id);
                      if (url) window.open(url, "_blank");
                    }}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Download CSV
                  </button>
                ) : file.status === "pending" ? (
                  <button
                    onClick={() => startIngestion(file.id)}
                    className="text-sm text-blue-500 hover:underline"
                    disabled={ingesting === file.id}
                  >
                    {ingesting === file.id ? "Ingesting..." : "Start Ingestion"}
                  </button>
                ) : (
                  <span className="text-gray-500 capitalize">{file.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
