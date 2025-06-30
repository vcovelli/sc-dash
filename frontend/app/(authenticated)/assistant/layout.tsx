"use client";
import { NavbarProvider, useNavContext } from "@/components/nav/NavbarContext";
import DesktopNav from "@/components/nav/DesktopNav";
import MobileDrawerNav from "@/components/nav/MobileDrawerNav";
import clsx from "clsx";

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavbarProvider>
      <AssistantLayoutInner>{children}</AssistantLayoutInner>
    </NavbarProvider>
  );
}

function AssistantLayoutInner({ children }: { children: React.ReactNode }) {
  const { fullscreen } = useNavContext();

  return (
    <div
      className={clsx(
        "relative w-full min-h-screen transition-colors",
        "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950",
        fullscreen && "overflow-hidden"
      )}
    >
      {/* Only show DesktopNav if not fullscreen */}
      {!fullscreen && <DesktopNav />}
      {/* Always show MobileDrawerNav so hamburger always works */}
      <MobileDrawerNav />
      <main
        className={clsx(
          "w-full flex items-center justify-center",
          fullscreen
            ? "h-[100dvh] min-h-0"
            : "min-h-[calc(100vh-40px)] pt-2 pb-2 md:pb-8"
        )}
        style={fullscreen ? { height: "100dvh", minHeight: 0, padding: 0 } : {}}
      >
        <div
          className={clsx(
            "relative flex flex-col w-full h-full max-w-full max-h-full transition-all",
            "lg:w-[700px] lg:max-w-[96vw] lg:h-[90vh] lg:max-h-[90vh] lg:rounded-3xl lg:shadow-2xl lg:border lg:border-gray-800/80 lg:bg-gray-950/95 lg:my-8",
            "xl:w-[900px] xl:max-w-[90vw] bg-gray-950/95 dark:bg-gray-950/95",
            fullscreen && "rounded-none shadow-none border-none h-[100dvh] max-h-none w-full max-w-full my-0"
          )}
          style={fullscreen ? { height: "100dvh", maxHeight: "none" } : {}}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
