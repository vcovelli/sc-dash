"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

// ---- Example placeholder data for widgets ----
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

// ---- Premium Dashboard ----
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
    <section
      className="
        min-h-screen w-full
        bg-gradient-to-br from-blue-50 to-indigo-100
        dark:from-gray-900 dark:to-gray-950
        transition-colors duration-500
        px-2 sm:px-4 py-6 sm:py-10
      "
      style={{ fontSize: "var(--body)" }}
    >
      {/* Header & Quick Actions */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-8 px-0">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "var(--h1)" }}>📊</span>
          <h1
            style={{ fontSize: "var(--h1)" }}
            className="font-extrabold text-gray-900 dark:text-gray-100 tracking-tight"
          >
            SupplyWise Dashboard
          </h1>
        </div>
        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2 sm:gap-2">
          <Link href="/uploads" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow transition flex items-center gap-1 justify-center"
              style={{ fontSize: "var(--body)" }}
            >
              <span style={{ fontSize: "var(--h2)" }}>➕</span> Upload File
            </button>
          </Link>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-200 transition shadow dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800 flex items-center gap-1 justify-center"
            style={{ fontSize: "var(--body)" }}
          >
            🧑‍🤝‍🧑 Add User
          </button>
          <Link href="/onboarding/request-assist" className="w-full sm:w-auto">
            <button
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition shadow dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center gap-1 justify-center"
              style={{ fontSize: "var(--body)" }}
            >
              💬 Request Support
            </button>
          </Link>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:gap-6 px-0">
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard label="Total Files Uploaded" value={fileCount ?? "..."} color="text-blue-600 dark:text-blue-400" />
          <StatCard label="Storage Used" value={storageUsed ?? "..."} color="text-green-600 dark:text-green-400" />
          <StatCard label="System Uptime" value={uptime ?? "..."} color="text-purple-600 dark:text-purple-400" />
        </div>

        {/* SETUP & PLAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Setup Progress Card */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-800 dark:text-gray-100 font-semibold flex items-center gap-2" style={{ fontSize: "var(--body)" }}>
                <span style={{ fontSize: "var(--h2)" }}>🛠️</span> Setup Progress
              </div>
              {COMPLETED_STEPS < ONBOARDING_STEPS && (
                <Link href="/onboarding">
                  <button className="px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition font-semibold"
                    style={{ fontSize: "var(--small)" }}
                  >
                    Finish setup
                  </button>
                </Link>
              )}
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2">
              <div
                className="h-2 bg-blue-400 dark:bg-blue-700 rounded transition-all"
                style={{ width: `${(COMPLETED_STEPS / ONBOARDING_STEPS) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>
              {COMPLETED_STEPS} of {ONBOARDING_STEPS} steps completed
            </p>
          </GlassCard>
          {/* Plan Usage Card */}
          <GlassCard>
            <div className="font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center gap-2" style={{ fontSize: "var(--body)" }}>
              <span className="inline-block px-2 py-1 rounded text-xs bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900"
                style={{ fontSize: "var(--small)" }}>
                {PLAN_TYPE} Plan
              </span>
              Usage
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-bold" style={{ fontSize: "var(--h2)", color: "inherit" }}>{ROWS_USED.toLocaleString()}</span>
              <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: "var(--body)" }}>/ {PLAN_LIMIT.toLocaleString()} rows used</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1">
              <div
                className="h-2 bg-green-400 dark:bg-green-600 rounded transition-all"
                style={{ width: `${(ROWS_USED / PLAN_LIMIT) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>
              {DAYS_LEFT} days left on trial – <span className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</span>
            </p>
          </GlassCard>
        </div>

        {/* ALERTS */}
        <div>
          {ALERTS.length > 0 ? (
            <GlassCard className="bg-yellow-100/80 dark:bg-yellow-900/80 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-100 flex items-center gap-2">
              {ALERTS.map((a, idx) => (
                <span key={idx} className="flex items-center" style={{ fontSize: "var(--body)" }}>
                  <b className="mr-2">{a.type === "error" ? "⚠️" : "ℹ️"}</b>
                  {a.msg}
                  {a.action && (
                    <Link href={a.action.href} className="ml-2 underline text-blue-700 dark:text-blue-300">
                      {a.action.label}
                    </Link>
                  )}
                </span>
              ))}
            </GlassCard>
          ) : (
            <GlassCard className="bg-green-50/80 dark:bg-green-950/70 border-l-4 border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 flex items-center gap-2">
              <span style={{ fontSize: "var(--body)" }}>✅ No issues detected</span>
            </GlassCard>
          )}
        </div>

        {/* ACTIVITY FEED & RECENT UPLOADS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <GlassCard>
            <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-100"
              style={{ fontSize: "var(--h2)" }}>
              Activity Feed
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-200">
              {ACTIVITY_FEED.map((item, idx) => (
                <li key={idx} className="flex items-center" style={{ fontSize: "var(--body)" }}>
                  <span className="mr-2" dangerouslySetInnerHTML={{ __html: item.text }} />
                  <span className="ml-2 text-gray-400 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>{item.time}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard>
            <RecentUploadsTable recentFiles={recentFiles} />
          </GlassCard>
        </div>

        {/* INSIGHTS, FEEDBACK, HELP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <GlassCard className="bg-blue-50/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex flex-col gap-2">
            <span className="font-semibold text-blue-800 dark:text-blue-200" style={{ fontSize: "var(--body)" }}>
              🚀 Try our new analytics dashboard!
            </span>
            <Link href="/analytics" className="underline text-blue-600 dark:text-blue-300" style={{ fontSize: "var(--body)" }}>
              Go to Analytics & Forecasts
            </Link>
          </GlassCard>
          <GlassCard className="flex flex-col gap-2">
            <span className="font-semibold text-blue-800 dark:text-blue-200" style={{ fontSize: "var(--body)" }}>
              💡 Give Feedback:
            </span>
            <Link href="/feedback" className="underline text-blue-600 dark:text-blue-300" style={{ fontSize: "var(--body)" }}>
              Take Survey
            </Link>
          </GlassCard>
          <GlassCard className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100" style={{ fontSize: "var(--body)" }}>Need help?</h3>
            <div className="flex gap-3">
              <Link href="/docs" className="text-blue-700 dark:text-blue-300 underline"
                style={{ fontSize: "var(--small)" }}>
                Getting Started Guide
              </Link>
              <Link href="/support" className="text-blue-700 dark:text-blue-300 underline"
                style={{ fontSize: "var(--small)" }}>
                Contact Support
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

// ---- Premium Glass Card Component ----
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-xl backdrop-blur-xl border border-white/20 dark:border-gray-900/30 p-4 sm:p-6 ${className}`}
      style={{ fontSize: "inherit" }}
    >
      {children}
    </div>
  );
}

// ---- Premium Stat Card ----
function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <GlassCard>
      <p className="text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>{label}</p>
      <h2 className={`font-extrabold ${color || "text-gray-800 dark:text-gray-100"}`} style={{ fontSize: "var(--h2)" }}>{value}</h2>
    </GlassCard>
  );
}

// ---- Premium Recent Uploads Table ----
function RecentUploadsTable({ recentFiles }: { recentFiles: any[] }) {
  return (
    <>
      <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-100 flex items-center gap-2"
        style={{ fontSize: "var(--h2)" }}>
        <span style={{ fontSize: "var(--body)" }}>🕒</span> Recent Uploads
      </h2>
      {Array.isArray(recentFiles) && recentFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse" style={{ fontSize: "var(--body)" }}>
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Filename</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Rows</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Uploaded</th>
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
        <p className="mt-2" style={{ fontSize: "var(--small)", color: "inherit" }}>No recent uploads found.</p>
      )}
    </>
  );
}
