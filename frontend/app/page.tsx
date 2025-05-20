export default function HomePage() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-6">
      <div className="max-w-4xl w-full text-center space-y-10">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Empower Your Supply Chain
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            AI-powered analytics for modern procurement. Upload CSVs, forecast trends, and drive smarter decisions—all from one intuitive platform.
          </p>
        </div>

        <div>
          <a
            href="/onboarding"
            className="inline-block px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300"
          >
            🚀 Get Started Free
          </a>
          <p className="mt-2 text-sm text-gray-500">No credit card required.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">📊 Real-Time Insights</h3>
            <p className="text-sm text-gray-600">Track KPIs and unlock deep supply chain visibility with instant data parsing.</p>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">🤖 AI Forecasting</h3>
            <p className="text-sm text-gray-600">Leverage machine learning to anticipate stock demand and pricing trends.</p>
          </div>
          <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">🔐 Secure & Scalable</h3>
            <p className="text-sm text-gray-600">Enterprise-grade infrastructure with seamless team onboarding and permissions.</p>
          </div>
        </div>

        <div className="pt-16 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
