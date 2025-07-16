import React from "react";
import GlassCard from "./GlassCard";
import { useRouter } from "next/navigation";
import { User } from "@/types";

export default function PlanInfoCard({ user }: { user: User }) {
  const router = useRouter();
  return (
    <div 
      className="hidden sm:flex flex-col items-center justify-center"
      style={{ minWidth: `calc(var(--body) * 8.5)` }}
    >
      <span 
        className="text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--small)" }}
      >
        Plan
      </span>
      <span 
        className="text-blue-600 dark:text-blue-400 font-bold"
        style={{ fontSize: "var(--h2)" }}
      >
        {user.plan}
      </span>
      <button
        onClick={() => router.push("/profile/plans")}
        className="font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
        style={{ 
          fontSize: "var(--small)",
          marginTop: `calc(var(--body) * 0.75)`,
          padding: `calc(var(--body) * 0.5) calc(var(--body) * 1.0)`
        }}
      >
        {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
      </button>
    </div>
  );
}

// For mobile, use this inside your main page
export function PlanInfoCardMobile({ user }: { user: User }) {
  const router = useRouter();
  return (
    <GlassCard 
      className="flex flex-col items-center"
      style={{ 
        padding: `calc(var(--body) * 0.75) calc(var(--body) * 1.0)`,
        marginBottom: `calc(var(--body) * 0.5)`
      }}
    >
      <span 
        className="text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--small)" }}
      >
        Plan
      </span>
      <span 
        className="text-blue-600 dark:text-blue-400 font-bold"
        style={{ fontSize: "var(--h2)" }}
      >
        {user.plan}
      </span>
      <button
        onClick={() => router.push("/profile/plans")}
        className="w-full font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
        style={{ 
          fontSize: "var(--small)",
          marginTop: `calc(var(--body) * 0.5)`,
          padding: `calc(var(--body) * 0.5) calc(var(--body) * 1.0)`
        }}
      >
        {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
      </button>
    </GlassCard>
  );
}
