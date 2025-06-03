"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const choices = [
  {
    label: "I’m starting fresh",
    description: "Set up new tables from scratch with our guided wizard.",
    icon: (
      <span className="relative inline-block">
        <span className="text-4xl sm:text-5xl">🆕</span>
        <span className="absolute -top-2 -right-7 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white shadow-lg">NEW</span>
      </span>
    ),
    route: "/onboarding/start-fresh"
  },
  {
    label: "I have a template or existing data",
    description: "Import your CSV, Excel, or one of our ready-to-go templates.",
    icon: <span className="text-4xl sm:text-5xl">📂</span>,
    route: "/onboarding/manual-map"
  },
  {
    label: "Help me do it / Do it for me",
    description: "Request expert assistance or hands-off white-glove onboarding.",
    icon: <span className="text-4xl sm:text-5xl">🤝</span>,
    route: "/onboarding/request-assist"
  }
];

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <main className="flex-grow flex items-center justify-center px-2 py-6 sm:py-12 bg-transparent">
      <div className="
        w-full max-w-4xl flex flex-col items-center
        py-4 sm:py-8 px-2 sm:px-6
        rounded-3xl shadow-xl
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl border border-white/20 dark:border-gray-900/30
        mx-auto
      ">
        <div className="text-center mb-4 sm:mb-8 w-full">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-4 drop-shadow-lg">
            Onboarding Wizard
          </h1>
          <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal">
            Let’s get your data into the system the way that works best for you.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-2">
          {choices.map((choice) => (
            <motion.button
              key={choice.route}
              whileHover={{ y: -5, scale: 1.04, boxShadow: "0 10px 24px #3b82f633" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              onClick={() => router.push(choice.route)}
              className={`
                group relative flex flex-col justify-between items-center text-center
                p-4 sm:p-6 rounded-2xl
                shadow-lg border border-transparent
                bg-white/70 dark:bg-[#212534]/70
                backdrop-blur-2xl
                transition-all
                min-h-[220px] sm:min-h-[270px]
                h-full cursor-pointer
                hover:border-blue-500
                focus:outline-none focus:ring-2 focus:ring-blue-400
                active:scale-[0.98]
              `}
            >
              <div className="flex flex-col items-center">
                <div className="mb-2 sm:mb-4">{choice.icon}</div>
                <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {choice.label}
                </span>
                <span className="text-sm sm:text-base text-gray-500 dark:text-gray-300 font-normal">
                  {choice.description}
                </span>
              </div>
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition text-blue-500 dark:text-blue-300">
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
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
