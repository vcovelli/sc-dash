"use client";

import { useRouter } from "next/navigation";

export default function ProPlanPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center py-16 px-4 bg-transparent">
      <div className="w-full max-w-5xl mx-auto">
        {/* Animated Gradient Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-clip-text text-transparent drop-shadow-md">
          Upgrade to Pro
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-300 max-w-2xl mx-auto mb-12 text-lg">
          The Pro plan is designed for ambitious teams and professionals who need more power, more insights, and more flexibility.
          It unlocks the full potential of the SupplyWise platform so you can scale confidently and work smarter—not harder.
        </p>
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14">
          <FeatureCard
            icon="🚀"
            title="Power Features"
            items={[
              "1,000 uploads/month",
              "Advanced dashboards and analytics",
              "Real-time forecasting with machine learning",
              "Unlimited access to historical trends",
              "Priority pipeline scheduling",
            ]}
          />
          <FeatureCard
            icon="📊"
            title="Insights That Drive Action"
            items={[
              "Customizable KPI dashboards",
              "Inventory efficiency scoring",
              "Lead time and supplier analysis",
              "Cost optimization suggestions",
              "Out-of-stock risk alerts",
            ]}
          />
          <FeatureCard
            icon="📦"
            title="Better Operations"
            items={[
              "Smart SKU tracking",
              "Warehouse optimization tools",
              "Shipment ETA forecasting",
              "CSV & API export support",
            ]}
          />
          <FeatureCard
            icon="📞"
            title="Priority Support"
            items={[
              "Priority email and chat support",
              "Direct Slack channel (optional)",
              "Onboarding assistance",
              "Access to beta features",
            ]}
          />
        </div>
        {/* Pricing & CTA */}
        <div className="flex flex-col items-center mt-8">
          <p className="text-xl font-bold mb-5 text-gray-800 dark:text-white drop-shadow">
            All this for just <span className="text-blue-600">$29/month</span>
          </p>
          <button
            onClick={() => alert("Redirecting to Stripe Checkout...")}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-lg text-lg transition-all duration-200"
          >
            Upgrade to Pro
          </button>
          <p className="text-sm text-gray-400 mt-3 text-center">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white/70 dark:bg-[#232a35]/80 rounded-3xl shadow-lg backdrop-blur-md p-7 flex flex-col gap-4 border border-gray-100 dark:border-gray-800">
      <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
        <span className="text-2xl">{icon}</span>
        {title}
      </h2>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 text-base space-y-1 pl-2">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
