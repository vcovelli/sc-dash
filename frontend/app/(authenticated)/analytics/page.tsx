"use client";

import FontSizeVarsProvider from "@/components/FontSizeVarsProvider";

export default function AnalyticsPage() {
  return (
    <FontSizeVarsProvider>
      <section className="flex flex-col h-full w-full overflow-auto bg-white dark:bg-gray-950" style={{ fontSize: "var(--body)" }}>
        {/* Page Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-10 gap-2">
          <h1
            className={`
              font-bold text-gray-800 dark:text-gray-100 
              leading-tight 
              w-full sm:w-auto
              text-[clamp(2rem,5vw,2.7rem)] 
              break-words
              mb-2 sm:mb-0
            `}
            style={{ fontSize: "var(--h1)" }}
          >
            📈 Analytics
            <span className="block sm:inline">&nbsp;&amp;&nbsp;Forecasts</span>
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              style={{ fontSize: "var(--body)" }}
              className="border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 w-full sm:w-auto"
            >
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
              <option>All Time</option>
            </select>
            <button
              style={{ fontSize: "var(--body)" }}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition dark:bg-blue-800 dark:hover:bg-blue-900 w-full sm:w-auto"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-6 py-4 sm:py-6">
          {[
            {
              label: "Total Uploads",
              value: "38",
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Monthly Trends Forecast",
              value: "+8.4%",
              color: "text-green-600 dark:text-green-400",
            },
            {
              label: "Most Common SKU",
              value: "SKU-3421",
              color: "text-indigo-600 dark:text-indigo-400",
            },
            {
              label: "Forecast Accuracy",
              value: "95.1%",
              color: "text-purple-600 dark:text-purple-400",
            },
          ].map((card, idx) => (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col justify-center min-h-[84px]"
            >
              <p style={{ fontSize: "var(--small)" }} className="text-gray-500 dark:text-gray-300 mb-1">
                {card.label}
              </p>
              <h2 style={{ fontSize: "var(--h2)", wordBreak: "break-all" }} className={`font-bold ${card.color}`}>
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Chart Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mx-2 sm:mx-6 mb-4 sm:mb-6">
          <h3
            style={{ fontSize: "var(--h2)" }}
            className="font-semibold text-gray-800 dark:text-gray-100 mb-4"
          >
            Demand Forecast (Next 6 Months)
          </h3>
          <div
            style={{ fontSize: "var(--body)" }}
            className="h-52 sm:h-72 flex items-center justify-center text-gray-400 dark:text-gray-500 italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg"
          >
            Chart coming soon...
          </div>
        </div>

        {/* Top SKUs Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mx-2 sm:mx-6 mb-16">
          <h3
            style={{ fontSize: "var(--h2)" }}
            className="font-semibold text-gray-800 dark:text-gray-100 mb-4"
          >
            Top Performing SKUs
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse" style={{ fontSize: "var(--body)" }}>
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">SKU</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Total Units</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Trend %</th>
                  <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Region</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sku: "SKU-3421", units: 1230, trend: "+5.4%", region: "North America" },
                  { sku: "SKU-1259", units: 980, trend: "+3.2%", region: "Europe" },
                  { sku: "SKU-8810", units: 765, trend: "-2.1%", region: "Asia-Pacific" },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{item.sku}</td>
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{item.units}</td>
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{item.trend}</td>
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{item.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </FontSizeVarsProvider>
  );
}
