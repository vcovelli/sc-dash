"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, Sparkles, Compass } from "lucide-react";

// Animated SVG background component (subtle floating sparkles)
function SparkleBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        <radialGradient id="glow" r="100%" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="35%" cy="25%" r="200" fill="url(#glow)" />
      <circle cx="75%" cy="60%" r="140" fill="url(#glow)" />
      <circle cx="55%" cy="80%" r="90" fill="url(#glow)" />
    </svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="
      relative min-h-screen w-full flex items-center justify-center
      bg-gradient-to-br from-blue-50 via-indigo-100 to-violet-100
      dark:from-[#10121c] dark:via-[#161B22] dark:to-[#151925]
      transition-colors duration-300 px-2 overflow-hidden
    ">
      <SparkleBg />
      <div className="
        absolute top-0 left-0 w-full flex flex-col items-center mt-8 pointer-events-none z-10
      ">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, type: "spring" }}
          className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400 tracking-wide mb-3"
        >
          🚀 Your new workspace starts here!
        </motion.h2>
      </div>

      <motion.div
        className="
          w-full max-w-md z-20
          rounded-3xl shadow-2xl
          px-4 py-8 sm:px-10 sm:py-12
          bg-white/90 dark:bg-[#161B22]/95
          border border-white/60 dark:border-blue-900/40
          flex flex-col items-center
          relative
        "
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
      >
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5, type: "spring" }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/80 shadow-lg mb-3"
        >
          <Sparkles className="h-9 w-9 text-blue-500 dark:text-blue-300 animate-pulse-slow" />
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="text-2xl sm:text-3xl font-extrabold text-blue-800 dark:text-blue-200 mb-2 text-center"
        >
          Welcome to <span className="text-blue-600 dark:text-blue-300">SupplyWise</span>!
        </motion.h1>
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 mb-7 max-w-md text-center font-medium">
          Set up your workspace in minutes or explore what you can do with a guided tour.
        </p>

        {/* Start Setup Button */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 4px 16px #3b82f6aa" }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: "spring" }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl
            bg-gradient-to-r from-blue-600 to-indigo-500
            text-white font-bold text-lg shadow-xl hover:from-blue-700 hover:to-indigo-600 transition
            mb-3 ring-2 ring-blue-100 dark:ring-blue-800 dark:bg-gradient-to-r dark:from-blue-800 dark:to-indigo-800"
          onClick={() => router.push("/onboarding")}
        >
          <UserPlus className="w-5 h-5" /> Start Setup <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>

        {/* Guided Tour Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: "spring" }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl
            bg-white/80 text-blue-700 border-2 border-blue-300 font-bold text-lg shadow
            hover:bg-blue-50 hover:border-blue-500 transition
            dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900 mb-2"
          onClick={() => router.push("/onboarding/tour")}
        >
          <Compass className="w-5 h-5" /> Guided Tour
        </motion.button>

        <div className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md text-center">
          <p>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Start Setup:</span>
            {" "}Guided onboarding to create your workspace and import data.
          </p>
          <p>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Guided Tour:</span>
            {" "}See a walkthrough of the platform features with tooltips and tips.
          </p>
        </div>
      </motion.div>
    </div>
  );
}