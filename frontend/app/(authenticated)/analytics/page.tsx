"use client";

export default function AnalyticsPage() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
        📈 Analytics & Forecasts
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Uploads</p>
          <h2 className="text-2xl font-bold text-blue-600">38</h2>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <p className="text-sm text-gray-500">Monthly Trends Forecast</p>
          <h2 className="text-2xl font-bold text-green-600">+8.4%</h2>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <p className="text-sm text-gray-500">Most Common SKU</p>
          <h2 className="text-2xl font-bold text-indigo-600">SKU-3421</h2>
        </div>
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <p className="text-sm text-gray-500">Forecast Accuracy</p>
          <h2 className="text-2xl font-bold text-purple-600">95.1%</h2>
        </div>
      </div>

      {/* Chart Section Placeholder */}
      <div className="bg-white border rounded-xl shadow-sm p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Demand Forecast (Next 6 Months)</h3>
        <div className="h-72 flex items-center justify-center text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
          Chart coming soon...
        </div>
      </div>

      {/* Data Breakdown Table Placeholder */}
      <div className="bg-white border rounded-xl shadow-sm p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Performing SKUs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b">SKU</th>
                <th className="px-4 py-2 border-b">Total Units</th>
                <th className="px-4 py-2 border-b">Trend %</th>
                <th className="px-4 py-2 border-b">Region</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sku: "SKU-3421", units: 1230, trend: "+5.4%", region: "North America" },
                { sku: "SKU-1259", units: 980, trend: "+3.2%", region: "Europe" },
                { sku: "SKU-8810", units: 765, trend: "-2.1%", region: "Asia-Pacific" },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{item.sku}</td>
                  <td className="px-4 py-2 border-b">{item.units}</td>
                  <td className="px-4 py-2 border-b">{item.trend}</td>
                  <td className="px-4 py-2 border-b">{item.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
