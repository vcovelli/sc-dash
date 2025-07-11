"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LucideUploadCloud,
  LucideUsers,
  LucideLifeBuoy,
  LucideSparkles,
  //LucideActivity,
  //LucideBarChart
} from "lucide-react";
import type { RecentFile } from "./types";
import StatCards from "./Components/StatCards";
import { SetupProgressCard, PlanUsageCard } from "./Components/SetupAndPlan";
import AlertsCard, { Alert } from "./Components/AlertsCard";
//import ActivityAndUploads from "./Components/ActivityAndUploads";
//import InsightsFeedbackHelp from "./Components/InsightsFeedbackHelp";
import api from "@/lib/axios";
import ActivityFeed from "./Components/ActivityFeed";
import RecentUploads from "./Components/RecentUploads";
import FloatingHelpButton from "./Components/FloatingHelpButton";

const PLAN_LIMIT = 10000;
const PLAN_TYPE = "Pro";
const DAYS_LEFT = 3;
const ONBOARDING_STEPS = 5;
const ALERTS: Alert[] = [];

type ActivityItem = {
  verb: string;
  target?: string;
  timestamp: string;
  meta?: { row_count?: number };
};

export default function DashboardPage() {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<string | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [rowsUsed, setRowsUsed] = useState<number>(0);
  const [activityFeed, setActivityFeed] = useState<{ text: string; time: string }[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    api.get("/accounts/dashboard-overview/")
      .then((res) => {
        setFileCount(res.data.total_files);
        setRecentFiles(res.data.recent_uploads || []);
        setStorageUsed(res.data.storage_used);
        setUptime(res.data.system_uptime);
        setRowsUsed(res.data.usage || 0);
      })
      .catch(() => setRecentFiles([]));

    api.get("/accounts/onboarding/progress/")
      .then((res) => {
        setCompletedKeys(res.data.completed_keys || []);
      })
      .catch((err) => {
        console.warn("Could not fetch onboarding progress", err);
      });

    api.get("/accounts/activity-feed/")
      .then((res) => {
        setActivityFeed(
          res.data.map((item: ActivityItem) => ({
            text: renderActivityText(item),
            time: new Date(item.timestamp).toLocaleString(),
          }))
        );
      })
      .catch(() => setActivityFeed([]));
  }, []);

  function renderActivityText(item: ActivityItem) {
  switch (item.verb) {
    case "uploaded file":
      return `✅ Uploaded <b>${item.target}</b>`;
    case "file marked success":
      return `🎉 Processed <b>${item.target}</b>${item.meta?.row_count ? ` (${item.meta.row_count} rows)` : ""}`;
    case "downloaded file":
      return `⬇️ Downloaded <b>${item.target}</b>`;
    case "updated settings":
      return `⚙️ Settings updated`;
    case "downloaded template":
      return `📄 Downloaded template <b>${item.target}</b>`;
    case "completed onboarding":
      return `🎉 Onboarding completed`;
    case "added user":
      return `🧑‍🤝‍🧑 Added teammate <b>${item.target}</b>`;
    case "activated pro version":
      return `💎 Upgraded to <b>Pro</b>`;
    //case "exported data":
      //return `📤 Exported <b>${item.target}</b>`;
    //case "finished tour":
      //return `🗺️ Finished interactive tour`;
    //case "changed password":
      //return `🔑 Password changed`;
    //case "verified email":
      //return `✅ Email verified`;
    case "support ticket submitted":
      return `🛟 Support ticket submitted${item.target ? `: <b>${item.target}</b>` : ""}`;
    case "deleted file":
      return `🗑️ Deleted <b>${item.target}</b>`;
    case "archived file":
      return `📦 Archived <b>${item.target}</b>`;
    //case "restored file":
      //return `♻️ Restored <b>${item.target}</b>`;
    //case "imported contacts":
      //return `📥 Imported contacts`;
    //case "invited user":
      //return `✉️ Invited <b>${item.target}</b>`;
    //case "connected integration":
      //return `🔌 Connected <b>${item.target}</b> integration`;
    default:
      // Capitalize and fallback elegantly
      return `${
        item.verb.charAt(0).toUpperCase() + item.verb.slice(1)
      }${item.target ? ` <b>${item.target}</b>` : ""}`;
  }
}

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 transition-colors duration-500 px-2 sm:px-4 py-6 sm:py-10">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto relative mb-8">
        <div className="rounded-3xl p-8 pb-10 bg-gradient-to-r from-indigo-100 via-blue-50 to-blue-200 dark:from-indigo-900 dark:via-blue-950 dark:to-blue-800 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-4">
            <LucideSparkles className="w-12 h-12 text-blue-600 animate-pulse" />
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                Welcome back, Vincent!
              </h2>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                Here&apos;s a quick overview of your workspace. Let&apos;s get productive! 🚀
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/uploads">
              <button className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow transition flex items-center gap-1">
                <LucideUploadCloud className="w-5 h-5" />
                Upload File
              </button>
            </Link>
            <Link href="/assistant">
              <button className="px-5 py-2 bg-indigo-100 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-200 transition shadow dark:bg-indigo-800 dark:text-gray-200 dark:hover:bg-indigo-800 flex items-center gap-1">
                <LucideUsers className="w-5 h-5" />
                AI Assistant
              </button>
            </Link>
            <Link href="/onboarding/request-assist">
              <button className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition shadow dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center gap-1">
                <LucideLifeBuoy className="w-5 h-5" />
                Request Support
              </button>
            </Link>
          </div>
          {/* SVG Wave */}
          <svg className="absolute bottom-0 left-0 w-full" height="24" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
            <path d="M0,0 C300,100 900,0 1200,100 L1200,120 L0,120 Z" fill="url(#wave-gradient)" />
            <defs>
              <linearGradient id="wave-gradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCards fileCount={fileCount} storageUsed={storageUsed} uptime={uptime} />
        </div>

        {/* Setup Progress & Plan Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SetupProgressCard
            onboardingSteps={ONBOARDING_STEPS}
            completedSteps={completedKeys.length}
            completedKeys={completedKeys}
            showOnboarding={showOnboarding}
            setShowOnboarding={setShowOnboarding}
          />
          <PlanUsageCard
            planType={PLAN_TYPE}
            planLimit={PLAN_LIMIT}
            rowsUsed={rowsUsed}
            daysLeft={DAYS_LEFT}
            showBranding={showOnboarding}
          />
        </div>

        {/* Alerts (if any) */}
        {ALERTS.length > 0 && (
          <div className="grid grid-cols-1">
            <AlertsCard alerts={ALERTS} />
          </div>
        )}

        {/* Activity Feed & Recent Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActivityFeed activityFeed={activityFeed} />
          <RecentUploads recentFiles={recentFiles} />
        </div>
      </div>
      <FloatingHelpButton />
    </section>
  );
}
