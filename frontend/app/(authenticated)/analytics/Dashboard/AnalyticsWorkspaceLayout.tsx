export default function AnalyticsWorkspaceLayout({
  leftPanel,
  rightPanel,
  children,
}: {
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row w-full min-h-0 min-w-0 flex-1 overflow-hidden">
      {/* Left Panel (Optional) */}
      {leftPanel && (
        <aside className="w-[420px] flex flex-col min-h-0 min-w-0 border-r bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 border-gray-200 dark:border-neutral-700">
          {leftPanel}
        </aside>
      )}

      {/* Main (Chart/Grid) - Static, Not Scrollable */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {/* Remove overflow-y-auto here! */}
        <div className="flex-1 min-h-0 w-full h-full p-2 md:p-6 bg-gradient-to-b from-[#f7fafd] to-[#e8f0fb] dark:bg-gradient-to-b dark:from-gray-950 dark:to-gray-900">
          {children}
        </div>
      </main>

      {/* Right Panel (Settings) - ONLY Panel Scrolls */}
      {rightPanel && (
        <aside className="w-[420px] flex flex-col min-h-0 min-w-0 border-l bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 border-gray-200 dark:border-neutral-700">
          {/* Wrap settings in a scroll container */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            {rightPanel}
          </div>
        </aside>
      )}
    </div>
  );
}
