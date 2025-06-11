import { WidgetConfig } from "../types";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NAVBAR_HEIGHT = 72; // px

export default function InsightPanel({
  widget,
  open,
  onClose,
  onRunAI, // Optional: pass a handler for running AI (or just use a placeholder)
}: {
  widget: WidgetConfig | undefined;
  open: boolean;
  onClose: () => void;
  onRunAI?: (widget: WidgetConfig) => void;
}) {
  return (
    <aside
      className={`
        fixed left-0
        z-40
        transition-all duration-300 ease-in-out
        bg-white dark:bg-gray-900 shadow-lg border-r border-neutral-200 dark:border-gray-800 p-6 flex flex-col
        ${open ? "w-[420px] opacity-100" : "w-0 opacity-0 pointer-events-none"}
      `}
      style={{
        top: NAVBAR_HEIGHT,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        overflow: "hidden",
      }}
    >
      {open && widget ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-bold truncate pr-4">{widget.title}</div>
            <button
              className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-gray-800 transition"
              onClick={onClose}
              aria-label="Close insight panel"
            >
              <span role="img" aria-label="close">✖️</span>
            </button>
          </div>
          
          {/* --- AI Analysis Button --- */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 16px 2px #6366f1" }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center gap-2 px-5 py-2 mb-6
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
            `}
            style={{
              boxShadow: "0 2px 8px 0 rgba(59,130,246,0.14)",
            }}
            onClick={() => onRunAI ? onRunAI(widget) : alert("AI analysis coming soon!")}
          >
            <Sparkles className="w-5 h-5 animate-pulse-slow" />
            <span>Run AI Analysis</span>
          </motion.button>

          <div>
            <div className="font-semibold mb-2">AI Insight:</div>
            <p className="text-neutral-700 dark:text-neutral-200">
              This chart shows <b>{widget.title}</b>. (AI-generated insight goes here.)
            </p>
          </div>
        </>
      ) : (
        <div className="text-neutral-400 mt-12 text-center select-none">
          <span>Select a chart to see insights.</span>
        </div>
      )}
    </aside>
  );
}

// Add to your global CSS (optional, for pulse animation)
 /*
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
.animate-pulse-slow {
  animation: pulse-slow 2s infinite;
}
*/
