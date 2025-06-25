"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Subtle animated SVG background for wow factor
function GlowBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden>
      <defs>
        <radialGradient id="bgGlowA" r="100%" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bgGlowB" r="100%" cx="80%" cy="80%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="33%" cy="22%" r="280" fill="url(#bgGlowA)" />
      <circle cx="80%" cy="78%" r="220" fill="url(#bgGlowB)" />
    </svg>
  );
}

// Choices data (use improved icons/badges)
const choices = [
  {
    label: "I’m starting fresh",
    description: "Design new tables from scratch using our step-by-step builder.",
    icon: (
      <span className="relative inline-block">
        <span className="text-4xl sm:text-5xl">🆕</span>
        <span className="absolute -top-2 -right-6 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-lg animate-pulse-slow select-none">
          NEW
        </span>
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
    <main className="flex-grow flex items-center justify-center px-2 py-6 sm:py-14 bg-transparent relative overflow-hidden">
      <GlowBg />
      <motion.div
        className="
          w-full max-w-4xl z-10
          flex flex-col items-center
          py-6 sm:py-10 px-2 sm:px-8
          rounded-3xl shadow-2xl
          bg-white/95 dark:bg-[#171A23]/90
          border border-blue-100 dark:border-blue-900/30
          mx-auto
          relative
          backdrop-blur-2xl
        "
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.9, delay: 0.08 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17, duration: 0.6, type: "spring" }}
          className="text-center mb-4 sm:mb-8 w-full"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-4 tracking-tight drop-shadow-lg">
            New User Onboarding
          </h1>
          <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Bring your data into SupplyWise in the way that works best for you.
          </p>
        </motion.div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-7 mt-2">
          {choices.map((choice) => (
            <motion.button
              key={choice.route}
              whileHover={{
                y: -8,
                scale: 1.05,
                boxShadow: "0 10px 32px #2563eb29, 0 1.5px 12px #1112",
                borderColor: "#2563eb",
                background: "linear-gradient(135deg,rgba(59,130,246,0.07) 0%,rgba(139,92,246,0.07) 100%)"
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 330, damping: 26 }}
              onClick={() => router.push(choice.route)}
              className={`
                group relative flex flex-col justify-between items-center text-center
                p-4 sm:p-6 rounded-2xl
                shadow-lg border-2 border-transparent
                bg-white/80 dark:bg-[#212534]/85
                transition-all
                min-h-[210px] sm:min-h-[250px] h-full cursor-pointer
                hover:border-blue-600 focus:border-blue-500
                focus:outline-none focus:ring-2 focus:ring-blue-300
                active:scale-[0.97]
              `}
              style={{ zIndex: 2 }}
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
              {/* Modern Arrow Fade-in on Hover */}
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition text-blue-600 dark:text-blue-400 pointer-events-none">
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 8l6 6-6 6" />
                </svg>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
