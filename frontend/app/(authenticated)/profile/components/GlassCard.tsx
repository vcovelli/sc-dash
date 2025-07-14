import React from "react";

export default function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-xl border border-white/20 dark:border-gray-900/30 backdrop-blur-xl ${className}`}
      style={{ fontSize: "inherit" }}
    >
      {children}
    </div>
  );
}
