import { Sparkles } from "lucide-react"; // Lucide or swap for your AI logo!
import { motion } from "framer-motion";

export default function RunAIInsightsButton({ onClick, className = "" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, boxShadow: "0 0 16px 2px #6366f1" }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2 px-5 py-2
        rounded-xl shadow-md
        bg-white/10 dark:bg-gray-800/60
        backdrop-blur-lg
        border border-blue-500/50 dark:border-blue-400/20
        text-blue-500 dark:text-blue-400
        font-semibold
        transition-all duration-200
        hover:bg-blue-500/20 hover:text-blue-600
        hover:shadow-blue-500/20
        focus:outline-none
        ${className}
      `}
      style={{
        boxShadow: "0 2px 8px 0 rgba(59,130,246,0.14)",
      }}
      onClick={onClick}
    >
      <Sparkles className="w-5 h-5 animate-pulse-slow" />
      <span>
        Run AI Analysis
      </span>
    </motion.button>
  );
}
