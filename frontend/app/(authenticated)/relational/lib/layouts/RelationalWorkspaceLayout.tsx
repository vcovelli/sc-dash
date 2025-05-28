"use client";

import React from "react";

export default function RelationalWorkspaceLayout({
  leftPanel,
  rightPanel,
  children,
}: {
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row h-full w-full bg-white overflow-hidden">
      {/* Left Panel */}
      {leftPanel && (
        <div className="transition-all duration-300 border-r bg-white overflow-hidden">
          {leftPanel}
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Right Panel */}
      {rightPanel && (
        <div className="transition-all duration-300 border-l bg-white overflow-hidden">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
