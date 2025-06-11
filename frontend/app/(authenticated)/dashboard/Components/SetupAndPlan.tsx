"use client";
import GlassCard from "./GlassCard";
import SetupProgressPanel from "./SetupProgressPanel";
import BrandingBlock from "./BrandingBlock";
import { Sparkles, ChevronDown } from "lucide-react";

export default function SetupAndPlan({
  planType,
  planLimit,
  rowsUsed,
  daysLeft,
  onboardingSteps,
  completedSteps,
  completedKeys,
  showOnboarding,
  setShowOnboarding,
}: {
  planType: string;
  planLimit: number;
  rowsUsed: number;
  daysLeft: number;
  onboardingSteps: number;
  completedSteps: number;
  completedKeys: string[];
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
}) {
  const progressPercent = (completedSteps / onboardingSteps) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Setup Progress (accordion) */}
      <GlassCard>
        {/* Accordion Header */}
        <button
          className="flex items-center justify-between w-full mb-3 cursor-pointer group focus:outline-none"
          aria-expanded={showOnboarding}
          aria-controls="onboarding-panel"
          onClick={() => setShowOnboarding(!showOnboarding)}
        >
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-semibold" style={{ fontSize: "var(--body)" }}>
            <Sparkles size={20} className="text-blue-500" />
            Setup Progress
            <span className="ml-2 text-xs text-blue-700 dark:text-blue-200 underline group-hover:text-blue-900 dark:group-hover:text-blue-300 font-semibold">
              {completedSteps} of {onboardingSteps} steps
            </span>
          </div>
          <ChevronDown
            size={22}
            className={`ml-2 text-gray-400 group-hover:text-blue-700 transition-transform duration-300 ${showOnboarding ? "rotate-180" : ""}`}
          />
        </button>
        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-3 overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1" style={{ fontSize: "var(--small)" }}>
          Complete all steps for the best experience!
        </p>
        {/* Checklist Panel */}
        <div
          id="onboarding-panel"
          className={`overflow-hidden transition-all duration-500 ${showOnboarding ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}
          style={{
            transition: "max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s",
          }}
        >
          {showOnboarding && (
            <SetupProgressPanel completedKeys={completedKeys} />
          )}
        </div>
      </GlassCard>

      {/* Plan Usage & Branding */}
      <GlassCard>
        <div className="font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center gap-2" style={{ fontSize: "var(--body)" }}>
          <span className="inline-block px-2 py-1 rounded text-xs bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900"
            style={{ fontSize: "var(--small)" }}>
            {planType} Plan
          </span>
          Usage
        </div>
        <div className="flex items-end gap-2 mb-1">
          <span className="font-bold" style={{ fontSize: "var(--h2)", color: "inherit" }}>{rowsUsed.toLocaleString()}</span>
          <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: "var(--body)" }}>/ {planLimit.toLocaleString()} rows used</span>
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1">
          <div
            className="h-2 bg-green-400 dark:bg-green-600 rounded transition-all"
            style={{ width: `${(rowsUsed / planLimit) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4" style={{ fontSize: "var(--small)" }}>
          {daysLeft} days left on trial – <a href="/profile/plans/pro" className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</a>
        </p>
        {/* Branding Block inside usage card if onboarding is expanded */}
        {showOnboarding && (
          <div className="mt-8 flex flex-col items-center justify-center">
            <BrandingBlock />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
