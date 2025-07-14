import React from "react";
import GlassCard from "./GlassCard";

export default function UsageCard({ user }: { user: any }) {
  return (
    <GlassCard className="p-4 sm:p-8 mt-0">
      <div className="font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center gap-2"
        style={{ fontSize: "var(--body)" }}>
        <span className="inline-block px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900"
          style={{ fontSize: "var(--small)" }}>
          {user.plan} Plan
        </span>
        Usage
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100"
          style={{ fontSize: "var(--h2)" }}>
          {(user.usage ?? 0).toLocaleString()}
        </span>
        <span className="text-gray-600 dark:text-gray-400 text-sm"
          style={{ fontSize: "var(--body)" }}>
          / {(user.usage_quota ?? 0).toLocaleString()} rows used
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1">
        <div
          className="h-2 bg-green-400 dark:bg-green-600 rounded transition-all"
          style={{
            width: `${Math.min(100, (user.usage / user.usage_quota) * 100)}%`
          }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--small)" }}>
        {user.days_left} days left on trial – <span className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</span>
      </p>
    </GlassCard>
  );
}
