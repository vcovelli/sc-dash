"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecentFile } from "./types";
import StatCards from "./Components/StatCards";
import SetupAndPlan from "./Components/SetupAndPlan";
import AlertsCard from "./Components/AlertsCard";
import type { Alert } from "./Components/AlertsCard";
import ActivityAndUploads from "./Components/ActivityAndUploads";
import InsightsFeedbackHelp from "./Components/InsightsFeedbackHelp";

import api from "@/lib/axios";

const PLAN_LIMIT = 10000;
const PLAN_TYPE = "Pro";
const DAYS_LEFT = 3;
const ONBOARDING_STEPS = 5;
const ALERTS: Alert[] = [];

export default function DashboardPage() {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<string | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [rowsUsed, setRowsUsed] = useState<number>(0);
  const [activityFeed, setActivityFeed] = useState<{ text: string; time: string }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    api.get("/dashboard-overview/")
      .then((res) => {
        setFileCount(res.data.total_files);
        setRecentFiles(res.data.recent_uploads || []);
        setStorageUsed(res.data.storage_used);
        setUptime(res.data.system_uptime);
        setRowsUsed(res.data.usage || 0);
      })
      .catch(() => setRecentFiles([]));

    api.get("/onboarding/progress/")
      .then((res) => {
        setCompletedKeys(res.data.completed_keys || []);
      })
      .catch((err) => {
        console.warn("Could not fetch onboarding progress", err);
      });

    // Fetch activity feed
    api.get("/activity-feed/")
      .then((res) => {
        setActivityFeed(
          res.data.map((item: any) => ({
            text: renderActivityText(item),
            time: new Date(item.timestamp).toLocaleString(),
          }))
        );
      })
      .catch(() => setActivityFeed([]));
  }, []);

  // Helper function to prettify activity feed
  function renderActivityText(item: any) {
    switch (item.verb) {
      case "uploaded file":
        return `✅ Uploaded <b>${item.target}</b>`;
      case "file marked success":
        return `🎉 Processed <b>${item.target}</b>${item.meta?.row_count ? ` (${item.meta.row_count} rows)` : ""}`;
      case "downloaded file":
        return `⬇️ Downloaded <b>${item.target}</b>`;
      case "updated settings":
        return `⚙️ Settings updated`;
      default:
        return `${item.verb} ${item.target ? `<b>${item.target}</b>` : ""}`;
    }
  }

  return (
    <section
      className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500 px-2 sm:px-4 py-6 sm:py-10"
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
              <span style={{ fontSize: "var(--h2)" }}>+</span> Upload File
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
        <StatCards fileCount={fileCount} storageUsed={storageUsed} uptime={uptime} />
        <SetupAndPlan
          planType={PLAN_TYPE}
          planLimit={PLAN_LIMIT}
          rowsUsed={rowsUsed}
          daysLeft={DAYS_LEFT}
          onboardingSteps={ONBOARDING_STEPS}
          completedSteps={completedKeys.length}
          completedKeys={completedKeys}
          showOnboarding={showOnboarding}
          setShowOnboarding={setShowOnboarding}
        />
        <AlertsCard alerts={ALERTS} />
        <ActivityAndUploads activityFeed={activityFeed} recentFiles={recentFiles} />
        <InsightsFeedbackHelp />
      </div>
    </section>
  );
}
