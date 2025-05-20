"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

export default function DashboardPage() {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<string | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        const res = await api.get("/api/dashboard-overview");
        setFileCount(res.data.total_files);
        setRecentFiles(res.data.recent_uploads || []);
        setStorageUsed(res.data.storage_used); // e.g., "1.2 GB"
        setUptime(res.data.system_uptime);     // e.g., "99.99%"
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setRecentFiles([]);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">📊 SupplyWise Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm text-gray-500 mb-2">Total Files Uploaded</h2>
          <p className="text-2xl font-semibold text-blue-600">
            {fileCount !== null ? fileCount : "..."}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm text-gray-500 mb-2">Storage Used</h2>
          <p className="text-2xl font-semibold text-green-600">
            {storageUsed ?? "..."}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm text-gray-500 mb-2">System Uptime</h2>
          <p className="text-2xl font-semibold text-purple-600">
            {uptime ?? "..."}
          </p>
        </div>
      </div>

      {/* Recent Uploads Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">🕒 Recent Uploads</h2>
        {Array.isArray(recentFiles) && recentFiles.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-500">
                <th className="border-b px-4 py-2">Filename</th>
                <th className="border-b px-4 py-2">Rows</th>
                <th className="border-b px-4 py-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{file?.file_name || "N/A"}</td>
                  <td className="px-4 py-2">{file?.row_count ?? "-"}</td>
                  <td className="px-4 py-2">
                    {file?.uploaded_at
                      ? new Date(file.uploaded_at).toLocaleString()
                      : "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">No recent uploads found.</p>
        )}
      </div>

      {/* Quick Link */}
      <div className="text-center mt-10">
        <Link href="/uploads">
          <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 hover:scale-105 transition">
            ➕ Upload a New File
          </button>
        </Link>
      </div>
    </div>
  );
}
