"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

// Example placeholder data for widgets
const PLAN_LIMIT = 10000;
const PLAN_TYPE = "Pro";
const ROWS_USED = 2430;
const DAYS_LEFT = 3;
const ONBOARDING_STEPS = 5;
const COMPLETED_STEPS = 3;
const ACTIVITY_FEED = [
  { text: "✅ Uploaded <b>orders.csv</b>", time: "2 hours ago" },
  { text: "⚙️ Settings updated", time: "Yesterday" },
  { text: "📤 Uploaded <b>inventory.csv</b>", time: "2 days ago" },
];
const ALERTS = [
  // { type: "error", msg: "3 file errors need review.", action: { label: "Review now", href: "/uploads" } },
];

export default function DashboardPage() {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<string | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api.get("/api/dashboard-overview")
      .then((res) => {
        setFileCount(res.data.total_files);
        setRecentFiles(res.data.recent_uploads || []);
        setStorageUsed(res.data.storage_used);
        setUptime(res.data.system_uptime);
      })
      .catch(() => setRecentFiles([]));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center md:text-left">
          📊 SupplyWise Dashboard
        </h1>
        <div className="flex gap-2 items-center justify-center">
          <Link href="/uploads">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition shadow">
              ➕ Upload File
            </button>
          </Link>
          <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition shadow dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800">
            <span className="mr-1">🧑‍🤝‍🧑</span>Add User
          </button>
          <Link href="/onboarding/request-assist">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition shadow dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              <span className="mr-1">💬</span>Request Support
            </button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total Files Uploaded" value={fileCount ?? "..."} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Storage Used" value={storageUsed ?? "..."} color="text-green-600 dark:text-green-400" />
        <StatCard label="System Uptime" value={uptime ?? "..."} color="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Onboarding Progress Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <div className="text-gray-800 dark:text-gray-100 font-medium mb-2">🛠️ Setup Progress</div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded">
            <div
              className="h-2 bg-blue-400 dark:bg-blue-700 rounded transition-all"
              style={{ width: `${(COMPLETED_STEPS / ONBOARDING_STEPS) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {COMPLETED_STEPS} of {ONBOARDING_STEPS} steps completed
          </p>
        </div>
        {COMPLETED_STEPS < ONBOARDING_STEPS && (
          <Link href="/onboarding">
            <button className="mt-2 md:mt-0 px-3 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800">
              Finish setup
            </button>
          </Link>
        )}
      </div>

      {/* Plan Usage & Limits */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="font-medium text-gray-700 dark:text-gray-100 mb-2">
            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 mr-2">
              {PLAN_TYPE} Plan
            </span>
            Usage
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{ROWS_USED.toLocaleString()}</span>
            <span className="text-gray-600 dark:text-gray-400">/ {PLAN_LIMIT.toLocaleString()} rows used</span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mt-2">
            <div
              className="h-2 bg-green-400 dark:bg-green-600 rounded transition-all"
              style={{ width: `${(ROWS_USED / PLAN_LIMIT) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {DAYS_LEFT} days left on trial – <span className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</span>
          </p>
        </div>
      </div>

      {/* Alerts/Health */}
      {ALERTS.length > 0 ? (
        <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded shadow-sm">
          {ALERTS.map((a, idx) => (
            <span key={idx} className="flex items-center">
              <b className="mr-2">{a.type === "error" ? "⚠️" : "ℹ️"}</b>
              {a.msg}
              {a.action && (
                <Link href={a.action.href} className="ml-2 underline text-blue-700 dark:text-blue-300">
                  {a.action.label}
                </Link>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-950 border-l-4 border-green-400 dark:border-green-600 p-4 rounded shadow-sm text-green-700 dark:text-green-200">
          ✅ No issues detected
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-100">Activity Feed</h2>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
          {ACTIVITY_FEED.map((item, idx) => (
            <li key={idx} className="flex items-center">
              <span
                className="mr-2"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
              <span className="ml-2 text-gray-400 dark:text-gray-400 text-xs">{item.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Insights / Updates / Feedback */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-semibold text-blue-800 dark:text-blue-200 mr-2">🚀 Try our new analytics dashboard!</span>
          <Link href="/analytics" className="underline text-blue-600 dark:text-blue-300">
            Go to Analytics & Forecasts
          </Link>
        </div>
        <div>
          <span className="font-semibold text-blue-800 dark:text-blue-200 mr-2">💡 Give Feedback:</span>
          <Link href="/feedback" className="underline text-blue-600 dark:text-blue-300">
            Take Survey
          </Link>
        </div>
      </div>

      {/* Help / Resources */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Need help?</h3>
          <div className="flex gap-3">
            <Link href="/docs" className="text-blue-700 dark:text-blue-300 underline text-sm">
              Getting Started Guide
            </Link>
            <Link href="/support" className="text-blue-700 dark:text-blue-300 underline text-sm">
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Uploads Widget (real data) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <RecentUploadsTable recentFiles={recentFiles} />
      </div>
    </section>
  );
}

// Stat Card
function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-lg p-6 flex flex-col justify-center min-h-[112px]">
      <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">{label}</p>
      <h2 className={`text-2xl font-bold ${color || "text-gray-800 dark:text-gray-100"}`}>{value}</h2>
    </div>
  );
}

// Recent Uploads Table
function RecentUploadsTable({ recentFiles }: { recentFiles: any[] }) {
  return (
    <>
      <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-100">🕒 Recent Uploads</h2>
      {Array.isArray(recentFiles) && recentFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Filename</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Rows</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-medium">{file?.file_name || "N/A"}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{file?.row_count ?? "-"}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {file?.uploaded_at
                      ? new Date(file.uploaded_at).toLocaleString()
                      : "Unknown"}
                  </td> 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">No recent uploads found.</p>
      )}
    </>
  );
}
