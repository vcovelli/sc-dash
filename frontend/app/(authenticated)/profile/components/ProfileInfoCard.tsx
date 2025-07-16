import React from "react";
import GlassCard from "./GlassCard";
import { User } from "@/types";

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

export default function ProfileInfoCard({ user, hideCard = false }: { user: User; hideCard?: boolean }) {
  const content = (
    <>
      {/* Avatar */}
      <div
        className="
          bg-blue-100 text-blue-600
          dark:bg-blue-900 dark:text-white
          rounded-full flex items-center justify-center
          font-bold shadow mx-auto sm:mx-0
        "
        style={{ 
          width: `calc(var(--body) * 3.5)`,
          height: `calc(var(--body) * 3.5)`,
          fontSize: "var(--h1)"
        }}
      >
        {user.username[0]?.toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 w-full flex flex-col items-center sm:items-start">
        <h3
          className="font-semibold text-gray-900 dark:text-white"
          style={{ 
            fontSize: "var(--h2)",
            marginBottom: `calc(var(--body) * 0.25)`
          }}
        >
          {user.username}
        </h3>
        <p
          className="text-gray-600 dark:text-gray-300 break-all profile-responsive"
          style={{ 
            fontSize: "var(--body)",
            marginBottom: `calc(var(--body) * 0.25)`
          }}
        >
          {user.email}
        </p>
        {user.role && (
          <div style={{ marginTop: `calc(var(--body) * 0.25)` }}>
            <span
              className="
                inline-block rounded-full
                bg-gradient-to-r from-purple-100 to-blue-100
                dark:from-purple-900 dark:to-blue-900
                text-purple-800 dark:text-purple-200
                border border-purple-200 dark:border-purple-700
                font-semibold
              "
              style={{ 
                fontSize: "var(--small)",
                padding: `calc(var(--body) * 0.25) calc(var(--body) * 0.75)`
              }}
            >
              {getRoleDisplayName(user.role)}
            </span>
          </div>
        )}
        <div 
          className="flex flex-wrap justify-center sm:justify-start"
          style={{ 
            marginTop: `calc(var(--body) * 0.5)`,
            gap: `calc(var(--body) * 0.5)`
          }}
        >
          <a
            href="/auth/change-password"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            style={{ fontSize: "var(--small)" }}
          >
            Change Password
          </a>
          <a
            href="/auth/change-email"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            style={{ fontSize: "var(--small)" }}
          >
            Change Email
          </a>
        </div>
      </div>
    </>
  );

  if (hideCard) {
    return (
      <div
        className="
          flex flex-col sm:flex-row items-center text-center sm:text-left
          w-full
        "
        style={{ gap: `calc(var(--body) * 1.0)` }}
      >
        {content}
      </div>
    );
  }

  return (
    <GlassCard
      className="
        flex flex-col sm:flex-row items-center text-center sm:text-left
      "
      style={{ 
        gap: `calc(var(--body) * 1.0)`,
        padding: `calc(var(--body) * 1.0) calc(var(--body) * 1.5)`
      }}
    >
      {content}
    </GlassCard>
  );
}
