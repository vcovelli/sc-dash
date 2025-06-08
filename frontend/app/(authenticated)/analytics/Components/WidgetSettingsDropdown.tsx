import { useLayoutEffect, useRef, useState } from "react";
import { WidgetConfig } from "../types";

export default function WidgetSettingsDropdown({
  anchorRef,
  widget,
  close,
}: {
  anchorRef: React.RefObject<HTMLButtonElement>;
  widget: WidgetConfig;
  close: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position panel below button
  useLayoutEffect(() => {
    if (anchorRef.current && panelRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef, showDropdown]);

  // Dismiss on click-away
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close, anchorRef]);

  return (
    <div
      ref={panelRef}
      className="absolute z-20 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 min-w-[220px]"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
      }}
    >
      <div className="font-semibold mb-2">{widget.title} Settings</div>
      <button
        className="w-full py-2 px-3 text-left rounded hover:bg-blue-100 dark:hover:bg-blue-900"
        onClick={() => alert("Open full settings (placeholder)")}
      >
        Edit chart settings
      </button>
      <button
        className="w-full py-2 px-3 text-left rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
        onClick={() => alert("Remove widget (placeholder)")}
      >
        Remove widget
      </button>
    </div>
  );
}
