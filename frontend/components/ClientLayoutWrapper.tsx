"use client";

import React, { createContext, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// All routes that should use the full-bleed gradient layout
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
  "/assistant"
];

function getLayoutMode(pathname: string) {
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isFullBleed = FULL_BLEED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );
  const isFullWidthPage = pathname.startsWith("/relational");
  const isNoFooterPage = isFullWidthPage;
  return { isAuthPage, isFullBleed, isFullWidthPage, isNoFooterPage };
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
  const { isAuthPage, isFullBleed, isFullWidthPage, isNoFooterPage } = getLayoutMode(pathname);

  // Control navbar visibility in context:
  const [showNavbar, setShowNavbar] = useState(true);

  // --- Auth page (login/signup) ---
  if (isAuthPage) return <>{children}</>;

  // --- Full-bleed gradient pages (welcome, onboarding, dashboard, etc.) ---
  if (isFullBleed) {
    return (
      <div className="flex flex-col min-h-screen w-full
        bg-gradient-to-br from-blue-50 to-indigo-100
        dark:from-gray-900 dark:to-gray-950
        transition-colors duration-500"
      >
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-start w-full">
          {children}
        </main>
        {!isNoFooterPage && <Footer />}
      </div>
    );
  }

  // --- Data grid (relational) pages: use context for Navbar ---
  if (isFullWidthPage) {
    return (
      <NavbarVisibilityContext.Provider value={{ showNavbar, setShowNavbar }}>
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#10151c] transition-colors duration-500">
          {showNavbar && <Navbar />}
          <main className="flex-grow overflow-hidden">{children}</main>
          {!isNoFooterPage && <Footer />}
        </div>
      </NavbarVisibilityContext.Provider>
    );
  }

  // --- Default pages (container/boxed look) ---
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa] dark:bg-[#161b22] transition-colors duration-500">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-10">
        {children}
      </main>
      {!isNoFooterPage && <Footer />}
    </div>
  );
}
