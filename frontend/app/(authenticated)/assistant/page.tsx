"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AssistantHeader from "./components/AssistantHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import { streamAssistantReply } from "./components/streamAssistantReply";
import axios from "axios";

// ---- Types
type Message = {
  sender: "ai" | "user";
  text: string;
  showFeedback: boolean;
  id: number | null;
};

export default function AssistantPage() {
  // --- AI chat state ---
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

  // --- Always scroll chat to bottom when messages/height change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 45);
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, loading, viewportHeight, scrollToBottom]);

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

  // --- Feedback & regenerate logic ---
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
    <>
      <AssistantHeader />
      <ChatMessages
        messages={messages}
        loading={loading}
        chatRef={chatRef}
        lastAiIndex={lastAiIndex}
        postFeedback={postFeedback}
        regenerate={regenerate}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        loading={loading}
        inputRef={inputRef}
      />
    </>
  );
}
