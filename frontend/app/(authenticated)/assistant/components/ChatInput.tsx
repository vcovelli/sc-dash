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
  );
}
