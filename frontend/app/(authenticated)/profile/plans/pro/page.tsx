"use client";

import { useRouter } from "next/navigation";

export default function ProPlanPage() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">
        Upgrade to <span className="text-blue-600">Pro</span>
      </h1>

      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
        The Pro plan is designed for ambitious teams and professionals who need
        more power, more insights, and more flexibility. It unlocks the full
        potential of the SupplyWise platform so you can scale confidently and
        work smarter—not harder.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">🚀 Power Features</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>1,000 uploads/month</li>
            <li>Advanced dashboards and analytics</li>
            <li>Real-time forecasting with machine learning</li>
            <li>Unlimited access to historical trends</li>
            <li>Priority pipeline scheduling</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📊 Insights That Drive Action</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Customizable KPI dashboards</li>
            <li>Inventory efficiency scoring</li>
            <li>Lead time and supplier analysis</li>
            <li>Cost optimization suggestions</li>
            <li>Out-of-stock risk alerts</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📦 Better Operations</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Smart SKU tracking</li>
            <li>Warehouse optimization tools</li>
            <li>Shipment ETA forecasting</li>
            <li>CSV & API export support</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📞 Priority Support</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Priority email and chat support</li>
            <li>Direct Slack channel (optional)</li>
            <li>Onboarding assistance</li>
            <li>Access to beta features</li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-10">
        <p className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          All this for just <span className="text-blue-600">$29/month</span>
        </p>
        <button
          onClick={() => alert("Redirecting to Stripe Checkout...")}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
        >
          Upgrade to Pro
        </button>
        <p className="text-sm text-gray-500 mt-2">Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
}
