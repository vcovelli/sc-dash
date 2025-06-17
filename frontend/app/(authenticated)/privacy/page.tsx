// app/(authenticated)/privacy/page.tsx

"use client";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <section
      className="
        min-h-screen w-full flex items-center justify-center
        bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950
        transition-colors duration-500
        px-2 sm:px-4 py-8
      "
      style={{ fontSize: "var(--body)" }}
    >
      <div className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-900/30 px-6 py-8 sm:px-10 sm:py-12 backdrop-blur-xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-300 mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6 text-lg font-medium">
          Your trust means everything to us.
        </p>

        <div className="space-y-6 text-gray-700 dark:text-gray-200">
          <div>
            <h2 className="font-bold text-xl mb-1">Who We Are</h2>
            <p>
              <b>SupplyWise</b> is your trusted analytics partner. We help modern businesses organize, analyze, and forecast their supply chain and operational data. We never sell your data. Our only goal is to help you make better, data-driven decisions.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">What We Collect</h2>
            <ul className="list-disc ml-6">
              <li>Your account information (name, email, company)</li>
              <li>Uploaded business data (e.g., orders, inventory, analytics)</li>
              <li>Usage analytics (only to improve the product)</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">How We Use Your Data</h2>
            <ul className="list-disc ml-6">
              <li>To deliver and improve our platform’s features</li>
              <li>To provide analytics and forecasting</li>
              <li>To respond to your support requests</li>
              <li>
                <span className="font-semibold text-green-600 dark:text-green-300">
                  Never for advertising, never sold to third parties.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Your Rights</h2>
            <ul className="list-disc ml-6">
              <li>Access or delete your data at any time</li>
              <li>Export your data in standard formats</li>
              <li>Contact support with any questions</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Security</h2>
            <p>
              All data is encrypted in transit and at rest. We use modern security practices and never share access without your permission.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Contact</h2>
            <p>
              Have questions? <Link href="/request-assist" className="text-blue-700 dark:text-blue-300 underline font-medium">Contact our support team</Link> any time.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-600 mt-8 text-center">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </section>
  );
}
