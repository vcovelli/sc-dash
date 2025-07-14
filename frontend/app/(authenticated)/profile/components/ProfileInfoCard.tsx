import React from "react";
import GlassCard from "./GlassCard";

function getRoleDisplayName(role: string): string {
  const roleMap: { [key: string]: string } = {
    admin: "Platform Admin",
    owner: "Organization Owner",
    ceo: "CEO/Global Access",
    national_manager: "National Manager",
    regional_manager: "Regional Manager",
    local_manager: "Site Manager",
    employee: "Employee",
    client: "Client/Partner",
    tech_support: "Tech Support",
    read_only: "Read Only",
    custom: "Custom Role",
  };
  return roleMap[role] || role;
}

export default function ProfileInfoCard({ user }: { user: any }) {
  return (
    <GlassCard
      className="
        flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-8
        text-center sm:text-left
      "
    >
      {/* Avatar */}
      <div
        className="
          w-16 h-16 bg-blue-100 text-blue-600
          dark:bg-blue-900 dark:text-white
          rounded-full flex items-center justify-center
          font-bold text-2xl shadow mx-auto sm:mx-0
        "
        style={{ fontSize: "var(--h2)" }}
      >
        {user.username[0]?.toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 w-full flex flex-col items-center sm:items-start">
        <h3
          className="font-semibold text-gray-900 dark:text-white mb-1"
          style={{ fontSize: "var(--h2)" }}
        >
          {user.username}
        </h3>
        <p
          className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-all mb-1"
          style={{ fontSize: "var(--body)" }}
        >
          {user.email}
        </p>
        {user.role && (
          <div className="mt-1 sm:mt-2">
            <span
              className="
                inline-block px-3 py-1 text-xs rounded-full
                bg-gradient-to-r from-purple-100 to-blue-100
                dark:from-purple-900 dark:to-blue-900
                text-purple-800 dark:text-purple-200
                border border-purple-200 dark:border-purple-700
                font-semibold
              "
              style={{ fontSize: "var(--small)" }}
            >
              {getRoleDisplayName(user.role)}
            </span>
          </div>
        )}
        <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
          <a
            href="/auth/change-password"
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            style={{ fontSize: "var(--small)" }}
          >
            Change Password
          </a>
          <a
            href="/auth/change-email"
            className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            style={{ fontSize: "var(--small)" }}
          >
            Change Email
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
