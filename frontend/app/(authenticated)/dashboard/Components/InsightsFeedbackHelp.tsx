import GlassCard from "./GlassCard";
import Link from "next/link";

export default function InsightsFeedbackHelp() {
  return (
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
  );
}
