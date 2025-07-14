"use client";
import GlassCard from "./GlassCard";
import SetupProgressPanel from "./SetupProgressPanel";
import BrandingBlock from "./BrandingBlock";
import { Sparkles, ChevronDown, BarChart3, Star } from "lucide-react";

export function SetupProgressCard({
  onboardingSteps,
  completedSteps,
  completedKeys,
  showOnboarding,
  setShowOnboarding,
}: {
  onboardingSteps: number;
  completedSteps: number;
  completedKeys: string[];
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
}) {
  const progressPercent = Math.round((completedSteps / onboardingSteps) * 100);
  return (
    <GlassCard className="relative flex flex-col h-full" style={{ fontSize: "var(--body)" }}>
      <button
        className="flex items-center justify-between w-full mb-3 cursor-pointer group focus:outline-none"
        aria-expanded={showOnboarding}
        aria-controls="onboarding-panel"
        onClick={() => setShowOnboarding(!showOnboarding)}
        style={{ fontSize: "var(--body)" }}
      >
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-semibold"
          style={{ fontSize: "var(--body)" }}>
          <Sparkles size={22} className="text-blue-500" />
          Setup Progress
          <span className="ml-2 underline group-hover:text-blue-900 dark:group-hover:text-blue-300 font-semibold"
            style={{ fontSize: "var(--small)", color: "var(--body)" }}>
            {completedSteps} of {onboardingSteps} steps
          </span>
        </div>
        <ChevronDown
          size={22}
          className={`ml-2 text-gray-400 group-hover:text-blue-700 transition-transform duration-300 ${showOnboarding ? "rotate-180" : ""}`}
        />
      </button>
      {/* Progress Bar */}
      <div className="flex items-center mb-2 gap-2" style={{ fontSize: "var(--small)" }}>
        <div className="w-8 flex items-center justify-center">{progressPercent === 100 ? "🎉" : "🛠️"}</div>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-2 bg-gradient-to-r ${progressPercent === 100 ? "from-green-400 to-blue-500" : "from-blue-400 to-indigo-500"} rounded transition-all`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="ml-2 font-semibold text-gray-500 dark:text-gray-300" style={{ fontSize: "var(--small)" }}>{progressPercent}%</span>
      </div>
      <p className="mb-1 text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>
        Complete all steps for the best experience!
      </p>
      {/* Animated Checklist Panel */}
      <div
        id="onboarding-panel"
        className={`overflow-hidden transition-all duration-500 ${showOnboarding ? "max-h-[600px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
        style={{
          transition: "max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s",
        }}
      >
        {showOnboarding && <SetupProgressPanel completedKeys={completedKeys} />}
      </div>
    </GlassCard>
  );
}

export function PlanUsageCard({
  planType,
  planLimit,
  rowsUsed,
  daysLeft,
  showBranding,
}: {
  planType: string;
  planLimit: number;
  rowsUsed: number;
  daysLeft: number;
  showBranding?: boolean;
}) {
  const usagePercent = Math.min(100, Math.round((rowsUsed / planLimit) * 100));
  const usageColor =
    usagePercent > 90
      ? "from-red-400 to-pink-600"
      : usagePercent > 70
      ? "from-yellow-400 to-orange-500"
      : "from-green-400 to-blue-500";
  return (
    <GlassCard className="flex flex-col h-full" style={{ fontSize: "var(--body)" }}>
      <div className="flex items-center gap-2 mb-2" style={{ fontSize: "var(--body)" }}>
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
          <Star className="w-5 h-5 text-yellow-500" />
        </div>
        <span className="inline-block px-2 py-1 rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900 font-semibold"
          style={{ fontSize: "var(--small)" }}>
          {planType} Plan
        </span>
        <span className="ml-2 text-gray-700 dark:text-gray-100 font-semibold" style={{ fontSize: "var(--body)" }}>Usage</span>
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="font-extrabold" style={{ fontSize: "var(--h2)", color: "inherit" }}>
          {rowsUsed.toLocaleString()}
        </span>
        <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: "var(--body)" }}>/ {planLimit.toLocaleString()} rows used</span>
      </div>
      <div className="flex items-center gap-2 mb-1" style={{ fontSize: "var(--small)" }}>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
          <div
            className={`h-2 bg-gradient-to-r ${usageColor} rounded transition-all`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <span className="ml-2 font-semibold" style={{ fontSize: "var(--small)" }}>{usagePercent}%</span>
      </div>
      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4 gap-2" style={{ fontSize: "var(--small)" }}>
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <span>
          {daysLeft} days left on trial –{" "}
          <a
            href="/profile/plans/pro"
            className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-400 transition"
          >
            Upgrade Now
          </a>
        </span>
      </div>
      {showBranding && (
        <div className="mt-8 flex flex-col items-center justify-center">
          <BrandingBlock />
        </div>
      )}
    </GlassCard>
  );
}
