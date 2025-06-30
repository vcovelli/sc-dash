"use client";
import { ArrowRight } from "lucide-react";

export default function ChatInput({
  input,
  setInput,
  handleSend,
  loading,
  inputRef,
}: {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e?: React.FormEvent) => void;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      onSubmit={handleSend}
      className={`
        w-full
        pt-2 pb-6
        transition-colors
        bg-transparent
      `}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div
        className={`
          mx-4 sm:mx-8 mb-2
          flex items-center
          rounded-full
          overflow-hidden
          border border-gray-200 dark:border-gray-800
          bg-white/90 dark:bg-[#181c23]/90
          shadow-lg dark:shadow-[0_4px_32px_0_rgba(0,0,0,0.60)]
          ring-1 ring-black/5 dark:ring-white/5
          transition-all
          focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-600
        `}
        style={{
          boxShadow: "0 2px 8px 0 rgba(16,20,40,0.04), 0 1.5px 12px 0 rgba(18,20,40,0.14)",
        }}
      >
        <input
          ref={inputRef}
          className={`
            flex-1 px-5 py-3 text-base
            bg-transparent
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none
            font-[450] tracking-wide
            transition-colors
            rounded-full
          `}
          placeholder="Ask anything about your data..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{
            fontSize: 17,
            WebkitAppearance: "none",
            appearance: "none",
            WebkitFontSmoothing: "antialiased",
          }}
          autoComplete="off"
          inputMode="text"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`
            h-10 w-10 mr-1
            flex items-center justify-center
            bg-blue-600 hover:bg-blue-700
            active:bg-blue-800
            text-white rounded-full
            shadow-sm
            transition
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600
            duration-150
          `}
          aria-label="Send message"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
