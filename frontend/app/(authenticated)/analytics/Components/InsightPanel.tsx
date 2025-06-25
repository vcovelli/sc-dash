"use client";

import { useState } from "react";
import { WidgetConfig } from "../types";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NAVBAR_HEIGHT = 72;

export default function InsightPanel({
  widget,
  open,
  onClose,
}: {
  widget: WidgetConfig | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAI = async (widget: WidgetConfig) => {
    setLoading(true);
    setInsight(null);
    setError(null);
    try {
      const res = await fetch("/api/ai/insight/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          chartData: widget?.data ?? [],
          chartConfig: {
            title: widget?.title ?? "Untitled",
            type: widget?.type ?? "unknown",
            settings: widget?.settings ?? {},
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("AI Insight error:", errText);
        throw new Error("AI API error");
      }

      const data = await res.json();
      setInsight(data.insight || "No insight returned.");
    } catch (err) {
      console.error(err);
      setError("❌ Failed to get AI insight. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 z-40 transition-all duration-300 ease-in-out
        bg-white dark:bg-gray-900 shadow-lg border-r border-neutral-200 dark:border-gray-800 p-6 flex flex-col
        ${open ? "w-[420px] opacity-100" : "w-0 opacity-0 pointer-events-none"}`}
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

          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 16px 2px #6366f1" }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2 mb-6
              rounded-xl shadow-md bg-white/10 dark:bg-gray-800/60 backdrop-blur-lg
              border border-blue-500/50 dark:border-blue-400/20 text-blue-500 dark:text-blue-400 font-semibold
              transition-all duration-200 hover:bg-blue-500/20 hover:text-blue-600 hover:shadow-blue-500/20
              focus:outline-none ${loading ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => handleRunAI(widget)}
            disabled={loading}
          >
            <Sparkles className={`w-5 h-5 ${loading ? "animate-spin" : "animate-pulse-slow"}`} />
            <span>{loading ? "Running..." : "Run AI Analysis"}</span>
          </motion.button>

          <div>
            <div className="font-semibold mb-2">AI Insight:</div>
            {loading && <p className="text-blue-400 dark:text-blue-300 animate-pulse">Generating insight…</p>}
            {error && <p className="text-red-500 dark:text-red-400">{error}</p>}
            {!loading && !error && (
              <p className="text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap">
                {insight || <>This chart shows <b>{widget.title}</b>. (AI-generated insight goes here.)</>}
              </p>
            )}
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
