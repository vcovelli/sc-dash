"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, Sparkles, Compass } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="
      min-h-screen w-full
      flex items-center justify-center
      bg-gradient-to-br from-blue-50 to-indigo-100
      dark:from-[#0d1117] dark:to-[#161B22]
      transition-colors duration-300
      px-2
    ">
      <div className="
        w-full max-w-md
        rounded-2xl shadow-2xl
        px-4 py-7
        sm:px-8 sm:py-10
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl border border-white/40 dark:border-gray-900/40
        flex flex-col items-center
      ">
        <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/60 shadow mb-2">
          <Sparkles className="h-10 w-10 text-blue-500 dark:text-blue-400" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-300 mb-1 text-center">
          Welcome to SupplyWise!
        </h1>
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-200 mb-6 max-w-md text-center">
          Get set up in minutes or take a quick tour to see what you can do.
        </p>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
            bg-blue-600 text-white font-bold text-base sm:text-lg shadow-lg hover:bg-blue-700 transition mb-2
            dark:bg-blue-700 dark:hover:bg-blue-600"
          onClick={() => router.push("/onboarding")}
        >
          <UserPlus className="w-5 h-5" /> Start Setup <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
            bg-white text-blue-700 border-2 border-blue-300 font-bold text-base sm:text-lg shadow 
            hover:border-blue-500 transition mb-2
            dark:bg-gray-800 dark:text-blue-300 dark:border-blue-900 dark:hover:border-blue-600"
          onClick={() => router.push("/onboarding/tour")}
        >
          <Compass className="w-5 h-5" /> Guided Tour
        </motion.button>

        <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md text-center">
          <p>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Start Setup:</span>
            {" "}Guided onboarding to create your workspace and import data.
          </p>
          <p>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Guided Tour:</span>
            {" "}See a walkthrough of the platform features with tooltips and tips.
          </p>
        </div>
      </div>
    </div>
  );
}
