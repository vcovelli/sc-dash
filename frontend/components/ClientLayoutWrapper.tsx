"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  "/"
];

const NO_FOOTER_ROUTES = [
  "/analytics",
  "/relational-ui",
  "/assistant" // Covers all pages starting with "/relational"
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
  return { isAuthPage, isFullBleed, isFullWidthPage, isAssistantPage, isNoFooterPage };
}

// ------------- Navbar Context -------------
type NavbarContextType = {
  showNavbar: boolean;
  setShowNavbar: (show: boolean) => void;
};

const NavbarVisibilityContext = createContext<NavbarContextType>({
  showNavbar: true,
  setShowNavbar: () => {},
});

export function useNavbarVisibility() {
  return useContext(NavbarVisibilityContext);
}

// ------------- Layout Component -------------
export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthPage, isFullBleed, isFullWidthPage, isAssistantPage, isNoFooterPage } = getLayoutMode(pathname);

  // Navbar visibility context for relational and assistant pages
  const [showNavbar, setShowNavbar] = useState(true);

  // --- Auth page (login/signup) ---
  if (isAuthPage) return <>{children}</>;

  // --- Full-width pages needing context for nav hide/show (relational & assistant) ---
  if (isFullWidthPage || isAssistantPage) {
    return (
      <NavbarVisibilityContext.Provider value={{ showNavbar, setShowNavbar }}>
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#10151c] transition-colors duration-500 overflow-hidden">
          {/* Assistant page: DO NOT render Navbar */}
          {isFullWidthPage && showNavbar && <Navbar />}
          {/* Do not render Navbar at all on /assistant */}
          <main className="flex-1 flex flex-col w-full overflow-hidden">
            {children}
          </main>
          {/* Hide footer if flagged */}
          {!isNoFooterPage && <Footer />}
        </div>
      </NavbarVisibilityContext.Provider>
    );
  }

  // --- Full-bleed dashboard/analytics ---
  if (isFullBleed) {
    return (
      <div
        className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500 overflow-hidden"
        style={{ minHeight: "100dvh" }} // iOS mobile viewport fix
      >
        <Navbar />
        <main className="flex-1 flex flex-col w-full overflow-hidden">
          {children}
        </main>
        {!isNoFooterPage && <Footer />}
      </div>
    );
  }

  // --- Default pages (boxed) ---
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa] dark:bg-[#161b22] transition-colors duration-500">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-10">{children}</main>
      {!isNoFooterPage && <Footer />}
    </div>
  );
}
