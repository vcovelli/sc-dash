"use client";

import PrivateRoute from "@/components/PrivateRoute";
import { UploadedFilesTable } from "@/components/UploadedFilesTable";
import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const useUserSchema = () => {
  const [hasSchema, setHasSchema] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    axios
      .get("http://192.168.1.42:8000/api/user-schema/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const schema = res.data?.expected_headers || [];
        setHasSchema(schema.length > 0);
      })
      .catch(() => setHasSchema(false));
  }, []);

  return hasSchema;
};

export default function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [expectedHeaders, setExpectedHeaders] = useState<string[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [extraHeaders, setExtraHeaders] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSchema = useUserSchema();

  useEffect(() => {
    const fetchSchema = async () => {
      const token = localStorage.getItem("access_token");
      try {
        const response = await axios.get("http://192.168.1.42:8000/api/user-schema/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExpectedHeaders(response.data?.expected_headers || []);
      } catch (err) {
        console.error("Schema fetch failed:", err);
        toast.error("❌ Error loading schema. Try regenerating it.");
      }
    };

    fetchSchema();
  }, []);

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

        const uploadedHeaders = Object.keys(rows[0]);
        const missing = expectedHeaders.filter((h) => !uploadedHeaders.includes(h));
        const extra = uploadedHeaders.filter((h) => !expectedHeaders.includes(h));

        setMissingHeaders(missing);
        setExtraHeaders(extra);

        const preview = [
          uploadedHeaders,
          ...rows.slice(0, 4).map((row) => uploadedHeaders.map((h) => row[h] || "")),
        ];
        setCsvPreview(preview);
      },
      error: (err) => {
        console.error("CSV Parse Error:", err);
        toast.error("❌ Unable to read CSV file.");
      },
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
    if (!file) return toast.warn("📂 No CSV selected.");

    if (missingHeaders.length || extraHeaders.length) {
      return toast.error("🚫 Fix CSV headers before submission.");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      await axios.post("http://192.168.1.42:8000/api/ingest-csv/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("✅ Upload successful!");
      setFile(null);
      setCsvPreview([]);
      setFileName("");
      setMissingHeaders([]);
      setExtraHeaders([]);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Upload failed.");
    }
  };

  return (
    <PrivateRoute>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="flex justify-center mt-12 px-4">
        <div className="w-full max-w-5xl bg-white p-10 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">📤 Upload a CSV File</h2>

          {hasSchema === false && (
            <div className="bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500 p-4 rounded mb-6">
              ⚠️ No schema found. Please{" "}
              <a href="/onboarding" className="underline text-blue-600">
                complete the setup wizard
              </a>
              .
            </div>
          )}

          {(missingHeaders.length > 0 || extraHeaders.length > 0) && (
            <div className="bg-red-100 text-red-900 border border-red-400 px-6 py-4 rounded mb-6">
              <p className="font-semibold mb-1">🚫 Header Validation Failed</p>
              {missingHeaders.length > 0 && (
                <p>❗ Missing: <strong>{missingHeaders.join(", ")}</strong></p>
              )}
              {extraHeaders.length > 0 && (
                <p>⚠️ Extra: <strong>{extraHeaders.join(", ")}</strong></p>
              )}
              <p className="text-sm mt-2">Adjust your CSV using the provided template.</p>
            </div>
          )}

          <div
            className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 p-10 text-center cursor-pointer transition-all duration-200"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-blue-700 font-medium text-lg">
              📎 Drag & drop your CSV here, or <span className="underline">click to browse</span>
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
              <p className="mt-6 text-gray-700 text-sm">
                ✅ Selected: <strong>{fileName}</strong> ({((file?.size || 0) / 1024).toFixed(2)} KB)
              </p>

              <div className="mt-4 overflow-x-auto border rounded border-gray-300">
                <table className="table-auto w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {csvPreview[0]?.map((col, i) => {
                        const isMissing = missingHeaders.includes(col);
                        const isExtra = extraHeaders.includes(col);
                        return (
                          <th
                            key={i}
                            className={`px-3 py-2 font-medium border-b ${
                              isMissing
                                ? "bg-red-200 text-red-900"
                                : isExtra
                                ? "bg-yellow-100 text-yellow-900"
                                : "text-gray-700"
                            }`}
                          >
                            {col}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(1).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 border-b">
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
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transform transition duration-150 ease-in-out"
              >
                🚀 Submit CSV
              </button>
            </>
          )}

          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">📁 Uploaded Files</h3>
            <UploadedFilesTable />
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
