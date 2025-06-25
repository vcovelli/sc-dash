export default function HomePage() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0d1117] dark:to-[#0d1117] flex items-center justify-center px-6">
      <div className="max-w-4xl w-full text-center space-y-10">
        {/* Headline + Subtext */}
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Empower Your Supply Chain
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300">
            AI-powered analytics for modern procurement. Upload CSVs, forecast trends, and drive smarter decisions—all from one intuitive platform.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <a
            href="/onboarding"
            className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300"
          >
            🚀 Get Started Free
          </a>
          <a
            href="/demo"
            className="px-8 py-4 text-lg font-semibold text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-300"
          >
            🧪 Try Demo Mode
          </a>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">No credit card required.</p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-[#161b22] shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">📊 Real-Time Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track KPIs and unlock deep supply chain visibility with instant data parsing.
            </p>
          </div>
          <div className="bg-white dark:bg-[#161b22] shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">🤖 AI Forecasting</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Leverage machine learning to anticipate stock demand and pricing trends.
            </p>
          </div>
          <div className="bg-white dark:bg-[#161b22] shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">🔐 Secure & Scalable</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enterprise-grade infrastructure with seamless team onboarding and permissions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-16 text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
