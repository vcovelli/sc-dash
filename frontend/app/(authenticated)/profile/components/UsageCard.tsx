import React from "react";
import GlassCard from "./GlassCard";

export default function UsageCard({ user }: { user: any }) {
  return (
    <GlassCard 
      style={{ 
        padding: `calc(var(--body) * 1.0) calc(var(--body) * 1.5)`,
        marginTop: '0'
      }}
      className="sm:p-8"
    >
      <div 
        className="font-semibold text-gray-700 dark:text-gray-100 flex items-center"
        style={{ 
          fontSize: "var(--body)",
          marginBottom: `calc(var(--body) * 0.5)`,
          gap: `calc(var(--body) * 0.5)`
        }}
      >
        <span 
          className="inline-block rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900"
          style={{ 
            fontSize: "var(--small)",
            padding: `calc(var(--body) * 0.25) calc(var(--body) * 0.5)`
          }}
        >
          {user.plan} Plan
        </span>
        Usage
      </div>
      <div 
        className="flex items-end"
        style={{ 
          gap: `calc(var(--body) * 0.5)`,
          marginBottom: `calc(var(--body) * 0.25)`
        }}
      >
        <span 
          className="font-bold text-gray-800 dark:text-gray-100"
          style={{ fontSize: "var(--h1)" }}
        >
          {(user.usage ?? 0).toLocaleString()}
        </span>
        <span 
          className="text-gray-600 dark:text-gray-400"
          style={{ fontSize: "var(--body)" }}
        >
          / {(user.usage_quota ?? 0).toLocaleString()} rows used
        </span>
      </div>
      <div 
        className="w-full bg-gray-200 dark:bg-gray-800 rounded"
        style={{ 
          height: `calc(var(--body) * 0.5)`,
          marginBottom: `calc(var(--body) * 0.25)`
        }}
      >
        <div
          className="bg-green-400 dark:bg-green-600 rounded transition-all"
          style={{
            height: `calc(var(--body) * 0.5)`,
            width: `${Math.min(100, (user.usage / user.usage_quota) * 100)}%`
          }}
        />
      </div>
      <p 
        className="text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--small)" }}
      >
        {user.days_left} days left on trial – <span className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</span>
      </p>
    </GlassCard>
  );
}
