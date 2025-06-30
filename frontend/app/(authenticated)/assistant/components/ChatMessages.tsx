"use client";
import { Loader2, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

type Message = {
  sender: "ai" | "user";
  text: string;
  showFeedback: boolean;
  id: number | null;
};

export default function ChatMessages({
  messages,
  loading,
  chatRef,
  lastAiIndex,
  postFeedback,
  regenerate,
}: {
  messages: Message[];
  loading: boolean;
  chatRef: React.RefObject<HTMLDivElement | null>;
  lastAiIndex: number;
  postFeedback: (msgIndex: number, rating: string) => void;
  regenerate: (msgIndex: number) => void;
}) {
  return (
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
        paddingBottom: loading ? "4.5rem" : "3.3rem",
        transition: "padding-bottom 0.15s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {messages.map((msg, i) => (
        <div key={`${msg.id ?? "msg"}-${i}`} className={`flex ${msg.sender === "ai" ? "justify-start" : "justify-end"}`}>
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
                  bottom: "-3.2rem",
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
        <div className="flex justify-start mt-16 mb-4">
          <div className="px-4 py-2 rounded-xl bg-blue-950 text-blue-300 animate-pulse flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
