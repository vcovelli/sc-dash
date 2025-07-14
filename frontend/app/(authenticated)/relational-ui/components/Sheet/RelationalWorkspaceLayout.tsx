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
    <div className="flex flex-row h-screen w-full overflow-hidden bg-white dark:bg-gray-900 text-black dark:text-white">
      {/* Left Panel */}
      {leftPanel && (
        <aside className="transition-all duration-300 border-r border-gray-200 dark:border-neutral-700 bg-white dark:bg-gray-900 overflow-hidden">
          {leftPanel}
        </aside>
      )}
      {/* Main Grid Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
      {/* Right Panel */}
      {rightPanel && (
        <aside className="transition-all duration-300 border-l border-gray-200 dark:border-neutral-700 bg-white dark:bg-gray-900 overflow-hidden">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}