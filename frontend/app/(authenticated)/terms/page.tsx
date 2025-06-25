// app/(authenticated)/terms/page.tsx

"use client";
import Link from "next/link";

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="text-gray-700 dark:text-gray-200 mb-6 text-lg font-medium">
          Please read these terms carefully before using SupplyWise.
        </p>

        <div className="space-y-6 text-gray-700 dark:text-gray-200">
          <div>
            <h2 className="font-bold text-xl mb-1">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SupplyWise, you agree to these Terms of Service and our <Link href="/privacy" className="text-blue-700 dark:text-blue-300 underline font-medium">Privacy Policy</Link>. If you do not agree, please do not use our platform.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">2. Your Account</h2>
            <ul className="list-disc ml-6">
              <li>Keep your account credentials secure.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>Notify us immediately if you suspect unauthorized access.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">3. Use of the Platform</h2>
            <ul className="list-disc ml-6">
              <li>Don’t use SupplyWise for any unlawful, harmful, or abusive purposes.</li>
              <li>Don’t try to reverse-engineer, hack, or disrupt our systems.</li>
              <li>All business data uploaded must be your own or have appropriate consent.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">4. Data & Privacy</h2>
            <p>
              We respect your privacy and only use your data to deliver our services, as outlined in our <Link href="/privacy" className="text-blue-700 dark:text-blue-300 underline font-medium">Privacy Policy</Link>.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">5. Service Availability</h2>
            <p>
              We strive for 99.99% uptime, but SupplyWise may occasionally be unavailable due to maintenance or technical issues. We are not liable for any losses arising from downtime.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">6. Termination</h2>
            <ul className="list-disc ml-6">
              <li>You may delete your account at any time.</li>
              <li>We may suspend or terminate access for violation of these terms or abuse of the service.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">7. Changes</h2>
            <p>
              We may update these Terms from time to time. We’ll notify you of any significant changes via email or the dashboard. Continued use means acceptance of any updates.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">8. Contact</h2>
            <p>
              Questions? Reach out any time via our <Link href="/request-assist" className="text-blue-700 dark:text-blue-300 underline font-medium">Support page</Link>.
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
