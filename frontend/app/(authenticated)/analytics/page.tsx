"use client";

export default function AnalyticsPage() {
  return (
    <section className="flex flex-col h-full w-full overflow-auto">
      {/* Page Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          📈 Analytics & Forecasts
        </h1>
        <div className="flex gap-2">
          <select className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
            <option>Last 30 Days</option>
            <option>Last 6 Months</option>
            <option>All Time</option>
          </select>
          <button className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition dark:bg-blue-800 dark:hover:bg-blue-900">
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-6">
        <div className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Total Uploads</p>
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">38</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Monthly Trends Forecast</p>
          <h2 className="text-xl font-bold text-green-600 dark:text-green-400">+8.4%</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Most Common SKU</p>
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SKU-3421</h2>
        </div>
        <div className="bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Forecast Accuracy</p>
          <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400">95.1%</h2>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 mx-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Demand Forecast (Next 6 Months)
        </h3>
        <div className="h-72 flex items-center justify-center text-gray-400 dark:text-gray-500 italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
          Chart coming soon...
        </div>
      </div>

      {/* Top SKUs Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 mx-6 mb-12">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Performing SKUs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">SKU</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Total Units</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Trend %</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">Region</th>
              </tr>
            </thead>
            <tbody>
              {[{
                sku: "SKU-3421", units: 1230, trend: "+5.4%", region: "North America"
              }, {
                sku: "SKU-1259", units: 980, trend: "+3.2%", region: "Europe"
              }, {
                sku: "SKU-8810", units: 765, trend: "-2.1%", region: "Asia-Pacific"
              }].map((item, idx) => (
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
  );
}
