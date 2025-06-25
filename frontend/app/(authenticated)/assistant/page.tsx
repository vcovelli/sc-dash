"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  ArrowRight,
  Menu as MenuIcon,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import axios from "axios";
import { streamAssistantReply } from "@/app/(authenticated)/assistant/components/streamAssistantReply";

// ---- Types
type Message = {
  sender: "ai" | "user";
  text: string;
  showFeedback: boolean;
  id: number | null;
};

function openMenu() {
  window.dispatchEvent(new CustomEvent("open-nav"));
}

function useNoBodyScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [enabled]);
}

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Hi! I'm your SupplyWise AI Assistant. I can help you summarize data, automate workflows, and answer questions about your business. How can I help today?",
      showFeedback: false,
      id: null,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- Dynamic chat height (with visualViewport for iOS/Android keyboard) ---
  const [viewportHeight, setViewportHeight] = useState("100vh");

  const updateHeight = useCallback(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      setViewportHeight(`${window.visualViewport.height}px`);
    } else if (typeof window !== "undefined") {
      setViewportHeight(`${window.innerHeight}px`);
    }
  }, []);

  useEffect(() => {
    updateHeight();
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", updateHeight);
    }
    return () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      } else if (typeof window !== "undefined") {
        window.removeEventListener("resize", updateHeight);
      }
    };
  }, [updateHeight]);

  useNoBodyScroll(true);

  // --- Always scroll chat to bottom when messages/height change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 45);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, viewportHeight, scrollToBottom]);

  // --- Keyboard-aware scroll (scroll input into view after keyboard animates)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    function scrollInputIntoView(retry = 0) {
      setTimeout(() => {
        if (input) {
          input.scrollIntoView({ block: "end", behavior: "smooth" });
          if (retry < 1) setTimeout(() => scrollInputIntoView(retry + 1), 150);
        }
      }, 120);
    }
    input.addEventListener("focus", () => scrollInputIntoView(0));
    return () => {
      input.removeEventListener("focus", () => scrollInputIntoView(0));
    };
  }, []);

  // --- Feedback & regenerate logic
  const postFeedback = async (msgIndex: number, rating: string) => {
    const lastMsg = messages[msgIndex];
    if (!lastMsg || lastMsg.sender !== "ai") return;
    try {
      await axios.post("/api/ai/feedback/", {
        prompt: messages[msgIndex - 1]?.text,
        response: lastMsg.text,
        rating,
        regenerated: false,
        actions_taken: [],
      });
      const updated = [...messages];
      updated[msgIndex] = { ...updated[msgIndex], showFeedback: false };
      setMessages(updated);
    } catch (err) {
      console.error("Feedback failed:", err);
    }
  };

  const regenerate = async (msgIndex: number) => {
    const prompt = messages[msgIndex - 1]?.text;
    if (!prompt) return;
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "", showFeedback: true, id: Date.now() },
    ]);
    try {
      await streamAssistantReply(prompt, (chunk: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
        });
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Sorry, something went wrong.", showFeedback: false, id: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMsg, showFeedback: false, id: Date.now() },
      { sender: "ai", text: "", showFeedback: true, id: Date.now() },
    ]);
    setInput("");
    setLoading(true);
    try {
      await streamAssistantReply(userMsg, (chunk: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
        });
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Sorry, something went wrong.", showFeedback: false, id: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Only show feedback on the most recent AI response
  const lastAiIndex = (() => {
    for (let i = messages.length - 1; i >= 0; --i) {
      if (messages[i].sender === "ai") return i;
    }
    return -1;
  })();

  return (
    <section
      className={`
        w-full min-h-screen
        bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950
        flex items-center justify-center p-0
        overscroll-none
        touch-manipulation
        select-none
        transition-colors
      `}
      style={{
        height: viewportHeight,
        minHeight: viewportHeight,
        maxHeight: viewportHeight,
        overscrollBehavior: "none",
      }}
    >
      <div
        className={`
          flex flex-col w-full h-full max-w-full max-h-full
          lg:w-[700px] lg:max-w-[96vw] lg:h-[90vh] lg:max-h-[90vh]
          lg:rounded-3xl lg:shadow-2xl lg:border
          lg:border-gray-800/80
          lg:bg-gray-950/95 lg:my-8
          xl:w-[900px] xl:max-w-[90vw]
          bg-gray-950/95 dark:bg-gray-950/95
          transition-all
        `}
        style={{
          height: viewportHeight,
          maxHeight: "100vh",
        }}
      >
        {/* HEADER */}
        <div className="
          w-full bg-gray-950 dark:bg-gray-950 px-4 py-4 flex items-center gap-3 border-b border-gray-800 shadow-sm sticky top-0 z-20
          lg:rounded-t-3xl
        ">
          <div className="bg-blue-700 p-2 rounded-full">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col text-left flex-1">
            <div className="text-base font-semibold text-white">SupplyWise AI</div>
            <div className="text-xs text-gray-400">Online — powered by Ollama</div>
          </div>
          <button
            className="ml-auto text-gray-300 hover:text-blue-400 active:scale-90 focus:outline-none transition"
            onClick={openMenu}
            aria-label="Open menu"
            tabIndex={0}
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>

        {/* CHAT */}
        <div
          ref={chatRef}
          className="
            flex-1 w-full overflow-y-auto px-2 py-3 sm:px-4 sm:py-4 space-y-4 bg-transparent
            scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-950
            overscroll-none
            touch-pan-y
            transition-colors
          "
          style={{
            minHeight: 0,
            paddingBottom: loading ? "4.5rem" : "3.3rem", // More space for feedback/loader
            transition: "padding-bottom 0.15s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {messages.map((msg, i) => (
            <div key={msg.id ?? i} className={`flex ${msg.sender === "ai" ? "justify-start" : "justify-end"}`}>
              <div className={`
                relative px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap
                ${msg.sender === "ai"
                  ? "bg-blue-950 text-blue-100 max-w-[95vw] sm:max-w-[85vw] lg:max-w-[75%]"
                  : "bg-blue-700 text-white max-w-[80vw] sm:max-w-[60vw] lg:max-w-[60%]"}
              `}>
                {msg.text}
                {msg.sender === "ai" && i === lastAiIndex && msg.showFeedback && (
                  <div
                    className="absolute left-2 flex items-center gap-2 pb-2"
                    style={{
                      bottom: "-3.2rem", // Extra breathing room
                    }}
                  >
                    <button onClick={() => postFeedback(i, "thumbs_up")}><ThumbsUp className="w-4 h-4 text-green-500" /></button>
                    <button onClick={() => postFeedback(i, "thumbs_down")}><ThumbsDown className="w-4 h-4 text-red-500" /></button>
                    <button onClick={() => regenerate(i)}><RotateCcw className="w-4 h-4 text-gray-500" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mt-16 mb-4"> {/* Push the loader down for spacing */}
              <div className="px-4 py-2 rounded-xl bg-blue-950 text-blue-300 animate-pulse flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <form
          onSubmit={handleSend}
          className="w-full px-2 sm:px-4 pt-2 pb-6
            bg-gradient-to-t from-gray-950/98 to-gray-950/85
            dark:from-gray-950/98 dark:to-gray-950/85
            backdrop-blur-md
            sticky bottom-0
            lg:rounded-b-3xl"
          style={{
            borderTop: "1px solid rgba(64,70,89,0.4)",
            paddingBottom: "1.5rem",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            zIndex: 10,
          }}
        >
          <div className="flex rounded-full bg-[#101425] border border-gray-800 shadow-inner overflow-hidden">
            <input
              ref={inputRef}
              className="flex-1 px-4 py-3 text-base bg-transparent text-gray-100 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none"
              placeholder="Ask anything about your data..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{ fontSize: 16, WebkitAppearance: "none", appearance: "none" }}
              autoComplete="off"
              inputMode="text"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
