"use client";
import { NavbarProvider, useNavContext } from "@/components/nav/NavbarContext";
import DesktopNav from "@/components/nav/DesktopNav";
import MobileDrawerNav from "@/components/nav/MobileDrawerNav";
import clsx from "clsx";
import { useKeyboardSafePadding } from "@/hooks/useKeyboardSafePadding";
import { useEffect, useState } from "react";

const EXTRA_PADDING = 0;
const MAX_KEYBOARD_OFFSET = 420;

// Mobile device detection helper
function useIsMobile(breakpoint: number = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    function handleResize() {
      setMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return mobile;
}

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavbarProvider>
      <AssistantLayoutInner>{children}</AssistantLayoutInner>
    </NavbarProvider>
  );
}

function AssistantLayoutInner({ children }: { children: React.ReactNode }) {
  const { fullscreen } = useNavContext();
  useKeyboardSafePadding(EXTRA_PADDING); // still called if you want it for input bar
  const isMobile = useIsMobile();

  // FULLSCREEN + MOBILE: use fixed overlay
  if (fullscreen && isMobile) {
    return (
      <div
        className="fixed inset-0 flex flex-col bg-white dark:bg-gray-950 z-50"
        style={{
          height: "100dvh",
          minHeight: "100dvh",
          maxHeight: "100dvh",
          width: "100vw",
          overscrollBehavior: "none",
        }}
      >
        {/* Navigation not shown in fullscreen on mobile */}
        <MobileDrawerNav />
        {children}
      </div>
    );
  }

  // Otherwise: normal card/desktop layout
  return (
    <div
      className={clsx(
        "relative w-full min-h-screen transition-colors",
        "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950",
        fullscreen && "overflow-hidden"
      )}
    >
      {!fullscreen && <DesktopNav />}
      <MobileDrawerNav />
      <main
        className={clsx(
          "w-full flex flex-1 flex-col min-h-0 justify-center items-center",
          fullscreen
            ? "h-[100dvh] min-h-0"
            : "min-h-[calc(100vh-40px)] pt-2 pb-0"
        )}
        style={fullscreen ? { height: "100dvh", minHeight: 0, padding: 0 } : {}}
      >
        <div
          className={clsx(
            "relative flex flex-col h-full min-h-0 w-full max-w-full max-h-full transition-all",
            "lg:w-[700px] lg:max-w-[96vw] lg:h-[90vh] lg:max-h-[90vh] lg:rounded-3xl lg:shadow-2xl lg:border",
            "lg:bg-white/95 dark:lg:bg-gray-950/95",
            "lg:border-gray-200/80 dark:border-gray-800/80",
            "mt-0 mb-0 lg:mt-8 lg:mb-8",
            "xl:w-[900px] xl:max-w-[90vw]",
            fullscreen && "rounded-none shadow-none border-none h-[100dvh] max-h-none w-full max-w-full my-0"
          )}
          style={fullscreen ? { height: "100dvh", maxHeight: "none" } : {}}
        >
          <div className="flex flex-col flex-1 min-h-0 h-full w-full relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
