"use client";

import PrivateRoute from "@/components/PrivateRoute";
import { UploadedFilesTable } from "@/components/UploadedFilesTable";
import { useState, useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = ["Date", "SKU", "Quantity"];

  const validateCsvStructure = (headers: string[]) =>
    expectedHeaders.every(col => headers.includes(col));

  const handleFile = (file: File) => {
  setFile(file);
  setFileName(file.name);

  Papa.parse(file, {
    skipEmptyLines: true,
    complete: (result) => {
      const rows = result.data as string[][];

      if (!Array.isArray(rows) || rows.length === 0 || rows[0].length === 0) {
        toast.error("⚠️ Invalid CSV structure. No readable data.");
        setCsvPreview([]);
        return;
      }

      setCsvPreview(rows.slice(0, 5));
    },
    error: (err) => {
      console.error(err);
      toast.error("❌ Failed to parse CSV. Please try again.");
    }
  });
};

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.warn("⚠️ Please select a CSV file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      await axios.post("http://192.168.1.42:8000/api/ingest-csv/", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Upload successful!");
      setFile(null);
      setCsvPreview([]);
      setFileName("");
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed.");
    }
  };

  return (
    <PrivateRoute>
      <ToastContainer position="bottom-right" autoClose={3000} />
      <div className="flex justify-center w-full mt-12">
        <div className="w-full max-w-5xl bg-white p-10 rounded-2xl shadow-xl transition-all duration-300">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-8">📤 Upload a CSV File</h2>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:border-blue-500 transition cursor-pointer"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-gray-500 text-lg">
              Drag & drop a CSV file here, or{" "}
              <span className="text-blue-600 underline font-medium">click to browse</span>
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={inputRef}
              className="hidden"
            />
          </div>

          {fileName && (
            <>
              <p className="mt-6 text-sm text-gray-600">
                ✅ File selected: <span className="font-semibold text-gray-900">{fileName}</span>
                <br />
                Size: <span className="text-gray-700">{((file?.size || 0) / 1024).toFixed(2)} KB</span>
              </p>

              <div className="mt-4 overflow-x-auto rounded border border-gray-200">
                <table className="text-sm w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      {csvPreview[0]?.map((col, i) => (
                        <th key={i} className="px-3 py-2 border-b border-gray-200 text-gray-700 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border-b border-gray-100 text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSubmit}
                className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95 transform transition duration-150 ease-in-out"
              >
                <span>🚀</span>
                Submit CSV
              </button>
            </>
          )}

          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">📄 Uploaded Files</h3>
            <UploadedFilesTable />
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
