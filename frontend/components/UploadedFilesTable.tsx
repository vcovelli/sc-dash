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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/ingestion/start/`,
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

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/files/download/${fileId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // or any other extension
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Download failed!");
    }
  };

  if (loading) return <p>Loading files...</p>;
  if (!files.length) return <p>No uploaded files found.</p>;

  return (
    <div className="overflow-x-auto bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm">
      <table className="min-w-full text-sm text-gray-800 dark:text-gray-100"> {/* <-- ADDED text colors here */}
        <thead>
          <tr className="bg-gray-100 dark:bg-[#21262d] text-left">
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Filename</th>
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Size</th>
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Rows</th>
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Uploaded By</th>
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Uploaded At</th>
            <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">Status</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-[#22272e]">
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">{file.file_name}</td>
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                {file.file_size ? getReadableSize(file.file_size) : "Unknown"}
              </td>
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">{file.row_count ?? "-"}</td>
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">{file.uploaded_by}</td>
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                {new Date(file.uploaded_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                {file.status === "success" && file.minio_path ? (
                  <button
                    onClick={() => handleDownload(file.id, file.file_name)}
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Download CSV
                  </button>
                ) : file.status === "pending" ? (
                  <button
                    onClick={() => startIngestion(file.id)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300"
                    disabled={ingesting === file.id}
                  >
                    {ingesting === file.id ? "Ingesting..." : "Start Ingestion"}
                  </button>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 capitalize">{file.status}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
