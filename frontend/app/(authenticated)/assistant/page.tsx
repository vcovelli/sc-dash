"use client";

import { useState } from "react";
import { Bot, Sparkles, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Summarize my recent activity",
    desc: "Get a quick summary of your uploads, edits, and recent changes.",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-indigo-400" />,
    title: "Forecast next month's demand",
    desc: "Let the assistant analyze trends and predict what you'll need.",
  },
  {
    icon: <Bot className="w-6 h-6 text-blue-400" />,
    title: "Automate a recurring task",
    desc: "Create a custom workflow powered by AI agenting.",
  },
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi! I’m your SupplyWise AI Assistant. I can help you summarize data, automate workflows, and answer questions about your business. How can I help today?",
    },
  ]);

  // No actual backend/agenting yet – just mock UI
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: "user", text: input }]);
    setInput("");
    // You could add a fake "AI" reply after a delay for demo
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-2 py-10 sm:py-16">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/70 shadow mb-1">
            <Bot className="h-8 w-8 text-blue-600 dark:text-blue-300" />
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
            AI Assistant <span className="text-blue-600 dark:text-blue-400">Beta</span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
            Let our AI help you automate, analyze, and optimize your business data.<br />
            <span className="text-blue-500 dark:text-blue-300 font-medium">Agentic actions and natural language automations coming soon.</span>
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {SUGGESTIONS.map((s, idx) => (
            <motion.div
              key={s.title}
              whileHover={{ scale: 1.03, y: -2 }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-blue-100 dark:border-blue-900 shadow p-4 flex flex-col items-start gap-2 cursor-pointer transition"
            >
              <div>{s.icon}</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">{s.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Mock Chat Area */}
        <div className="mt-6 bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 h-72 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "ai" ? "justify-start" : "justify-end"}`}>
              <div
                className={`px-4 py-2 rounded-xl max-w-[80%] ${
                  msg.sender === "ai"
                    ? "bg-blue-100 dark:bg-blue-950 text-gray-900 dark:text-blue-100"
                    : "bg-indigo-600 text-white dark:bg-indigo-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 mt-2">
          <input
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 shadow transition"
            placeholder="Ask me anything or try: 'Summarize my data'"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
            disabled
          >
            Send <ArrowRight className="ml-1 w-4 h-4" />
          </button>
        </form>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">AI chat and agenting actions coming soon!</div>
      </div>
    </section>
  );
}
