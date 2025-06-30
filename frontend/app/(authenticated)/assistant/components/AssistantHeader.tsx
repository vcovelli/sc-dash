import { Bot, Menu as MenuIcon, Maximize2, Minimize2 } from "lucide-react";
import { useNavContext } from "@/components/nav/NavbarContext";

export default function AssistantHeader() {
  const { fullscreen, setFullscreen, setShowNav } = useNavContext();
  return (
    <div className="w-full bg-gray-950 px-4 py-4 flex items-center gap-3 border-b border-gray-800 shadow-sm sticky top-0 z-30 lg:rounded-t-3xl">
      {/* Fullscreen toggle - LEFT */}
      <button
        className="mr-1 text-gray-300 hover:text-blue-400 p-2 rounded-full focus:outline-none"
        onClick={() => setFullscreen(!fullscreen)}
        aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
      <div className="bg-blue-700 p-2 rounded-full flex items-center">
        <Bot className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-base font-semibold text-white truncate flex items-center gap-2">
          SupplyWise AI
          <span className="ml-2 text-xs bg-yellow-500/80 rounded px-2 py-0.5 font-bold text-gray-900 tracking-tight uppercase">Beta</span>
        </span>
        <span className="text-xs text-gray-400 truncate">Online — powered by Ollama</span>
      </div>
      {/* Hamburger/menu - RIGHT: Always works */}
      <button
        className="ml-1 text-gray-300 hover:text-blue-400 p-2 rounded-full focus:outline-none"
        onClick={() => setShowNav(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
