"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AssistantHeader from "./components/AssistantHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import { streamAssistantReply } from "./components/streamAssistantReply";
import { useKeyboardSafePadding } from "@/hooks/useKeyboardSafePadding";
import axios from "axios";

type Message = {
  sender: "ai" | "user";
  text: string;
  showFeedback: boolean;
  id: number | null;
};

// Detect iOS (iPhone, iPad, iPod, and iPadOS)
function isIOS() {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && 'ontouchend' in document)
  );
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

  // Keyboard padding for mobile (doesn't affect desktop)
  const keyboardOffset = useKeyboardSafePadding(20);

  // Always scroll to bottom on new message or input focus
  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, keyboardOffset, scrollToBottom]);

  // Feedback & regenerate logic
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
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], showFeedback: false };
        return updated;
      });
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

  const lastAiIndex = (() => {
    for (let i = messages.length - 1; i >= 0; --i) {
      if (messages[i].sender === "ai") return i;
    }
    return -1;
  })();

  return (
    <div className="flex flex-col h-[100dvh] min-h-0 w-full">
      <AssistantHeader />
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          paddingBottom: isIOS() ? 0 : Math.min(keyboardOffset, 420),
          transition: "padding-bottom 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <ChatMessages
          messages={messages}
          loading={loading}
          chatRef={chatRef}
          lastAiIndex={lastAiIndex}
          postFeedback={postFeedback}
          regenerate={regenerate}
        />
      </div>
      <div className="w-full">
        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          loading={loading}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}
