"use client";
import PrivateRoute from "@/components/PrivateRoute";
import { UploadedFilesTable } from "@/components/UploadedFilesTable";
import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";
import api from "@/lib/axios";
import { Download, UploadCloud } from "lucide-react";

type TableSchema = {
  table_name: string;
  expected_headers?: string[];
  columns?: string[];
};

// Fetches all user schemas
const useUserSchemas = () => {
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSchemas([]);
      setLoading(false);
      return;
    }
    api
      .get("/user-table-schemas/")
      .then((res) => setSchemas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSchemas([]))
      .finally(() => setLoading(false));
  }, []);
  return { schemas, loading };
};

// CSV Template Download
function downloadTemplate(headers: string[], table: string) {
  const csv = headers.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${table}_template.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function UploadsPage() {
  // Table selection and schema
  const { schemas, loading } = useUserSchemas();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // File and CSV preview
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [extraHeaders, setExtraHeaders] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // "Select a table" alert state
  const [showSelectTableAlert, setShowSelectTableAlert] = useState(false);

  // Get selected schema object
  const selectedSchema = schemas.find((s) => s.table_name === selectedTable);

  // Auto-select first table if only one
  useEffect(() => {
    if (!selectedTable && schemas.length === 1) {
      setSelectedTable(schemas[0].table_name);
    }
  }, [schemas, selectedTable]);

  // Clear header errors if table switches
  useEffect(() => {
    setMissingHeaders([]);
    setExtraHeaders([]);
    setCsvPreview([]);
    setFile(null);
    setFileName("");
    setShowSelectTableAlert(false);
  }, [selectedTable]);

  // Handle CSV drag or browse
  const handleFile = (file: File) => {
    setFile(file);
    setFileName(file.name);
    Papa.parse(file, {
      skipEmptyLines: true,
      header: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[];
        if (!rows || rows.length === 0) {
          toast.error("⚠️ Empty or invalid CSV.");
          setCsvPreview([]);
          return;
        }
        if (!selectedSchema) {
          toast.error("❌ Select a table to validate your CSV.");
          return;
        }
        const expectedHeaders: string[] = selectedSchema.expected_headers || selectedSchema.columns || [];
        const uploadedHeaders = Object.keys(rows[0]);
        setMissingHeaders(expectedHeaders.filter((h) => !uploadedHeaders.includes(h)));
        setExtraHeaders(uploadedHeaders.filter((h) => !expectedHeaders.includes(h)));
        // Limit preview to 10 rows for clarity
        setCsvPreview([
          uploadedHeaders,
          ...rows.slice(0, 10).map((row) => uploadedHeaders.map((h) => row[h] || "")),
        ]);
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        toast.error("❌ Unable to read CSV file.");
      },
    });
  };
  
  const handleUploadBoxClick = () => {
    if (!selectedTable) {
      setShowSelectTableAlert(true);
      return;
    }
    setShowSelectTableAlert(false);
    inputRef.current?.click();
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

  // Main file submission handler
  const handleSubmit = async () => {
    if (!file) return toast.warn("📂 No CSV selected.");
    if (!selectedTable) return toast.error("Select a table to upload data to.");
    if (missingHeaders.length || extraHeaders.length) {
      return toast.error("🚫 Fix CSV headers before submission.");
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("table_name", selectedTable);
      await api.post("/ingest-csv/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("✅ Upload successful!");
      setFile(null); setCsvPreview([]); setFileName(""); setMissingHeaders([]); setExtraHeaders([]);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // LOADING or NO SCHEMA
  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] text-xl text-gray-400 dark:text-gray-500">
      <span className="animate-pulse">Loading your schemas...</span>
    </div>
  );
  if (!schemas.length) return (
    <FontSizeVarsProvider>
      <PrivateRoute>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <div className="flex justify-center mt-20 px-4">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-5">📤 Upload a CSV File</h2>
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded">
              ⚠️ No schema found. Please{" "}
              <a href="/onboarding" className="underline text-blue-600 dark:text-blue-400">
                complete the setup wizard
              </a>
              .
            </div>
          </div>
        </div>
      </PrivateRoute>
    </FontSizeVarsProvider>
  );

  // MAIN UI
  return (
    <FontSizeVarsProvider>
      <PrivateRoute>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <div className="flex flex-col items-center justify-start min-h-[100vh] px-4 pt-12 pb-20 bg-gradient-to-tr from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 transition-all">
          <div className="w-full max-w-5xl bg-white/80 dark:bg-gray-950/90 shadow-2xl rounded-2xl p-8 md:p-12 border border-gray-100 dark:border-gray-900 backdrop-blur">
            {/* Sticky header & table select */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-1">📤 CSV Upload</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Import bulk data using your table’s schema below.</p>
              </div>
              {schemas.length > 1 && (
                <div className="w-full md:w-64">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 ml-1">Target Table</label>
                  <select
                    value={selectedTable || ""}
                    onChange={e => setSelectedTable(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 font-semibold transition"
                  >
                    <option value="" disabled>-- Select Table --</option>
                    {schemas.map(s => (
                      <option key={s.table_name} value={s.table_name}>
                        {s.table_name.charAt(0).toUpperCase() + s.table_name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ALERT: Select a table */}
            {showSelectTableAlert && (
              <div className="mb-4 animate-pulse bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-400 dark:text-yellow-100 rounded p-3 text-center font-semibold transition">
                ⚠️ Please select a table to upload your CSV.
              </div>
            )}

            {/* Schema template display */}
            {selectedSchema && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">Template Columns:</span>
                {(selectedSchema.expected_headers || selectedSchema.columns || []).map((h: string) => (
                  <span key={h} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-xs font-mono text-blue-900 dark:text-blue-100 border dark:border-blue-700">
                    {h}
                  </span>
                ))}
                <button
                  className="ml-4 flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
                  onClick={() => downloadTemplate(selectedSchema.expected_headers || selectedSchema.columns || [], selectedSchema.table_name)}
                  title="Download CSV template"
                  type="button"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>
            )}

            {/* Drag & Drop upload */}
            <div
              className={`group relative border-2 border-dashed ${file ? "border-green-400 bg-green-50 dark:bg-green-950" : "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"} rounded-xl transition p-8 mb-6 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900`}
              onClick={handleUploadBoxClick}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <UploadCloud className="w-8 h-8 mb-2 text-blue-500 dark:text-blue-300 animate-bounce group-hover:animate-none" />
              <p className="text-blue-700 dark:text-blue-200 font-semibold text-lg">
                {file ? "Replace CSV" : "Drag & drop your CSV here, or click to browse"}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                ref={inputRef}
                className="hidden"
                disabled={!selectedTable}
              />
              {file && (
                <span className="absolute right-3 top-3 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 font-mono shadow">
                  {fileName} ({((file?.size || 0) / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>

            {/* Validation feedback */}
            {(missingHeaders.length > 0 || extraHeaders.length > 0) && (
              <div className="mb-5 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900 text-red-900 dark:text-red-100 px-6 py-4 text-sm font-medium">
                <span className="block text-base font-bold mb-1">🚫 Header Validation Failed</span>
                {missingHeaders.length > 0 && (
                  <span className="block mb-1">❗ <b>Missing:</b> <span className="font-mono">{missingHeaders.join(", ")}</span></span>
                )}
                {extraHeaders.length > 0 && (
                  <span className="block">⚠️ <b>Extra:</b> <span className="font-mono">{extraHeaders.join(", ")}</span></span>
                )}
                <span className="text-xs mt-1 block text-red-700 dark:text-red-300">Adjust your CSV using the template for this table.</span>
              </div>
            )}

            {/* CSV Preview Table */}
            {fileName && (
              <div className="mt-2 overflow-x-auto border rounded border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-inner max-h-64">
                <table className="table-auto w-full text-xs whitespace-nowrap">
                  <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
                    <tr>
                      {csvPreview[0]?.map((col, i) => {
                        const isMissing = missingHeaders.includes(col);
                        const isExtra = extraHeaders.includes(col);
                        return (
                          <th
                            key={i}
                            className={`px-3 py-2 border-b font-semibold text-xs sticky top-0 z-20 ${isMissing ? "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200" : isExtra ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100" : "text-gray-700 dark:text-gray-200"}`}
                            style={{ fontSize: "var(--body)" }}
                          >
                            {col}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border-b">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col items-center gap-3 mt-10 mb-0">
              <button
                onClick={handleSubmit}
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md text-lg transition hover:from-blue-700 hover:to-indigo-700 active:scale-95
                  ${(!file || !selectedTable || missingHeaders.length > 0 || extraHeaders.length > 0 || uploading) ? "opacity-60 cursor-not-allowed" : ""}
                `}
                disabled={!file || !selectedTable || missingHeaders.length > 0 || extraHeaders.length > 0 || uploading}
              >
                {uploading ? "Uploading..." : "🚀 Submit CSV"}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Your data is private and securely processed. See the <a href="/privacy" className="underline">Privacy Policy</a>.
              </span>
            </div>

            {/* Uploaded files section */}
            <div className="mt-14">
              <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100" style={{ fontSize: "var(--h2)" }}>
                📁 Uploaded Files
              </h3>
              <UploadedFilesTable />
            </div>
          </div>
        </div>
      </PrivateRoute>
    </FontSizeVarsProvider>
  );
}
