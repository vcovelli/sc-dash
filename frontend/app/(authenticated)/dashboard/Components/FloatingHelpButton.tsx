"use client";
import { useState, useEffect } from "react";
import { LifeBuoy } from "lucide-react";
import Link from "next/link";

export default function FloatingHelpButton() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);

  // Listen for menu-open class on body
  useEffect(() => {
    const checkMenuOpen = () => {
      setHide(typeof window !== "undefined" && document.body.classList.contains("menu-open"));
    };

    // Initial check
    checkMenuOpen();

    // Listen for changes (menu toggle)
    const observer = new MutationObserver(checkMenuOpen);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // Clean up
    return () => observer.disconnect();
  }, []);

  if (hide) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        aria-label="Open help"
        onClick={() => setOpen(true)}
        className="fixed z-50 bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
        style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.24)" }}
      >
        <LifeBuoy className="w-6 h-6" />
      </button>
      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs sm:max-w-sm mx-4 mb-12 sm:mb-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <LifeBuoy className="w-6 h-6 text-blue-500" />
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Need Help?</span>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/tour" className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800 text-base">
                🚀 Take a Product Tour
              </Link>
              <Link href="/docs" className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800 text-base">
                📖 Getting Started Guide
              </Link>
              <Link href="/support" className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800 text-base">
                💬 Contact Support
              </Link>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none"
              aria-label="Close"
            >
              x
            </button>
          </div>
        </div>
      )}
    </>
  );
}
