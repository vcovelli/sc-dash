"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// You can expand these as your app grows
const ONBOARDING_ROUTES = [
  "/onboarding",
  "/onboarding/setup",
  "/onboarding/start-fresh",
  "/onboarding/manual-map",
  "/onboarding/request-assist",
];

function getLayoutMode(pathname: string) {
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isOnboarding = ONBOARDING_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );
  const isFullWidthPage = pathname.startsWith("/relational");
  const isNoFooterPage = isFullWidthPage;
  return { isAuthPage, isOnboarding, isFullWidthPage, isNoFooterPage };
}

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthPage, isOnboarding, isFullWidthPage, isNoFooterPage } = getLayoutMode(pathname);

  if (isAuthPage) return <>{children}</>;

  // Onboarding/setup wizard: high-end glassy gradient bg, cards pop
  if (isOnboarding) {
    return (
      <div className="
        flex flex-col min-h-screen
        bg-gradient-to-br
        from-[#e9f0fb] via-[#f6faff] to-[#e6ecf6]
        dark:from-[#1e293b] dark:via-[#232c3b] dark:to-[#10151c]
        transition-colors duration-500
      ">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-start w-full px-2 sm:px-4 pt-10 pb-10">
          {children}
        </main>
        {!isNoFooterPage && <Footer />}
      </div>
    );
  }

  // Data grid (relational) pages: just solid bg, fill screen
  if (isFullWidthPage) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#10151c] transition-colors duration-500">
        <Navbar />
        <main className="flex-grow overflow-hidden">{children}</main>
        {!isNoFooterPage && <Footer />}
      </div>
    );
  }

  // Dashboard, profile, etc.: subtle solid bg, centered container
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
