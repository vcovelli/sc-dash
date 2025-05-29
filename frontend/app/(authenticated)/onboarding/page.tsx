"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Card options
const choices = [
  {
    label: "I’m starting fresh",
    description: "Set up new tables from scratch with our guided wizard.",
    icon: (
      <span className="relative inline-block">
        <span className="text-5xl">🆕</span>
        <span className="absolute -top-2 -right-5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow">NEW</span>
      </span>
    ),
    route: "/onboarding/start-fresh"
  },
  {
    label: "I have a template or existing data",
    description: "Import your CSV, Excel, or one of our ready-to-go templates.",
    icon: <span className="text-6xl">📂</span>,
    route: "/onboarding/manual-map"
  },
  {
    label: "Help me do it / Do it for me",
    description: "Request expert assistance or hands-off white-glove onboarding.",
    icon: <span className="text-6xl">🤝</span>,
    route: "/onboarding/request-assist"
  }
];

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <main className="flex-grow flex items-start justify-center px-4 pt-6 pb-12">
      <div className="
        w-full max-w-5xl flex flex-col items-center py-6 px-4
        rounded-3xl shadow-2xl
        bg-white/90 dark:bg-[#181d22]/80
        backdrop-blur-xl
        border border-gray-200 dark:border-zinc-800
      ">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 drop-shadow-lg">
            Onboarding Wizard
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Let’s get your data into the system the way that works best for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 w-full">
          {choices.map((choice) => (
            <motion.button
              key={choice.route}
              whileHover={{ y: -6, scale: 1.06, boxShadow: "0 8px 40px #0002" }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              onClick={() => router.push(choice.route)}
              className={`
                group relative flex flex-col justify-between items-center text-center
                px-6 py-8 sm:px-8 sm:py-10 rounded-3xl
                shadow-xl transition-all border-2 border-transparent
                bg-gradient-to-br from-[#f4f6fb] to-[#e4e8f0]
                dark:from-[#232c3b] dark:to-[#181d22]
                hover:shadow-2xl hover:border-blue-400
                focus:outline-none focus:ring-2 focus:ring-blue-400
                min-h-[320px] h-full
              `}
            >
              <div className="flex flex-col items-center">
                <div className="mb-4">{choice.icon}</div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {choice.label}
                </span>
                <span className="text-base sm:text-lg text-gray-500 dark:text-gray-300 opacity-90 font-medium">
                  {choice.description}
                </span>
              </div>

              <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-80 transition">
                <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow text-blue-400 dark:text-white">
                  <path d="M10 8l6 6-6 6" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}
