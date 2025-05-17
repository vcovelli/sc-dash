"use client";

import { useRouter } from "next/navigation";

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-6">
      <div className="max-w-3xl w-full space-y-12 text-center">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Onboarding Wizard
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Let’s get your data into the system the way that works best for you.
          </p>
        </div>

        <div className="grid gap-6">
          <button
            onClick={() => router.push("/onboarding/start-fresh")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg w-full shadow-md"
          >
            🆕 I’m starting fresh
          </button>

          <button
            onClick={() => router.push("/onboarding/manual-map")}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg w-full shadow-md"
          >
            📂 I have a template or existing data
          </button>

          <button
            onClick={() => router.push("/onboarding/request-assist")}
            className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-4 px-6 rounded-lg w-full shadow-md"
          >
            🤝 Help me do it / Do it for me
          </button>
        </div>

        <footer className="pt-16 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </footer>
      </div>
    </section>
  );
}
