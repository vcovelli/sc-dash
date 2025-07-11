"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import { NavbarProvider } from "@/components/nav/NavbarContext";
import DesktopNav from "@/components/nav/DesktopNav";
import HamburgerButton from "@/components/nav/HamburgerButton";
import MobileDrawerNav from "@/components/nav/MobileDrawerNav";

// Full-bleed dashboard-like routes (gradient BG, no page container)
const FULL_BLEED_ROUTES = [
  "/onboarding",
  "/onboarding/setup",
  "/onboarding/start-fresh",
  "/onboarding/manual-map",
  "/onboarding/request-assist",
  "/onboarding/start",
  "/onboarding/tour",
  "/welcome",
  "/dashboard",
  "/profile",
  "/uploads",
  "/analytics",
  "/terms",
  "/privacy",
  "/",
  "/users",
];

const NO_FOOTER_ROUTES = [
  "/analytics",
  "/relational-ui",
  "/assistant"
];

// ADD THIS: routes to HIDE hamburger on
const NO_HAMBURGER_ROUTES = [
  "/assistant",
  "/relational-ui",
];

function getLayoutMode(pathname: string) {
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isFullBleed = FULL_BLEED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );
  const isFullWidthPage = pathname.startsWith("/relational");
  const isAssistantPage = pathname === "/assistant";
  const isNoFooterPage =
    NO_FOOTER_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );
  // Hamburger show/hide logic:
  const isNoHamburger =
    NO_HAMBURGER_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );
  return { isAuthPage, isFullBleed, isFullWidthPage, isAssistantPage, isNoFooterPage, isNoHamburger };
}

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthPage,
    isFullBleed,
    isFullWidthPage,
    isAssistantPage,
    isNoFooterPage,
    isNoHamburger
  } = getLayoutMode(pathname);

  // --- Auth page (login/signup) ---
  if (isAuthPage) return <>{children}</>;

  // --- Full-width pages needing nav context ---
  if (isFullWidthPage || isAssistantPage) {
    return (
      <NavbarProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#10151c] transition-colors duration-500 overflow-hidden">
          {isFullWidthPage && <DesktopNav />}
          {!isNoHamburger && !pathname.startsWith("/relational-ui") && <HamburgerButton />}
          <MobileDrawerNav />
          <main className="flex-1 flex flex-col w-full overflow-hidden">
            {children}
          </main>
          {!isNoFooterPage && <Footer />}
        </div>
      </NavbarProvider>
    );
  }

  // --- Full-bleed dashboard/analytics ---
  if (isFullBleed) {
    return (
      <NavbarProvider>
        <div
          className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500 overflow-hidden"
          style={{ minHeight: "100dvh" }} // iOS mobile viewport fix
        >
          <DesktopNav />
          {!isNoHamburger && <HamburgerButton />}
          <MobileDrawerNav />
          <main className="flex-1 flex flex-col w-full overflow-hidden">
            {children}
          </main>
          {!isNoFooterPage && <Footer />}
        </div>
      </NavbarProvider>
    );
  }

  // --- Default pages (boxed) ---
  return (
    <NavbarProvider>
      <div className="flex flex-col min-h-screen bg-[#f5f7fa] dark:bg-[#161b22] transition-colors duration-500">
        <DesktopNav />
        {!isNoHamburger && <HamburgerButton />}
        <MobileDrawerNav />
        <main className="flex-grow container mx-auto px-4 py-10">{children}</main>
        {!isNoFooterPage && <Footer />}
      </div>
    </NavbarProvider>
  );
}
