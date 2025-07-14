import React from "react";
import GlassCard from "./GlassCard";
import { useRouter } from "next/navigation";

export default function PlanInfoCard({ user }: { user: any }) {
  const router = useRouter();
  return (
    <div className="hidden sm:flex flex-col items-center justify-center min-w-[140px]">
      <span className="text-gray-500 dark:text-gray-400 text-sm"
        style={{ fontSize: "var(--small)" }}>
        Plan
      </span>
      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg"
        style={{ fontSize: "var(--body)" }}>
        {user.plan}
      </span>
      <button
        onClick={() => router.push("/profile/plans")}
        className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
        style={{ fontSize: "var(--small)" }}
      >
        {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
      </button>
    </div>
  );
}

// For mobile, use this inside your main page
export function PlanInfoCardMobile({ user }: { user: any }) {
  const router = useRouter();
  return (
    <GlassCard className="flex flex-col items-center py-2 px-4 mb-2">
      <span className="text-gray-500 dark:text-gray-400 text-sm"
        style={{ fontSize: "var(--small)" }}>
        Plan
      </span>
      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg"
        style={{ fontSize: "var(--body)" }}>
        {user.plan}
      </span>
      <button
        onClick={() => router.push("/profile/plans")}
        className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
        style={{ fontSize: "var(--small)" }}
      >
        {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
      </button>
    </GlassCard>
  );
}
