"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt, FaTimes } from "react-icons/fa";
import { ThemeToggle } from "@/components/settings/theme/ThemeToggle";
import { useNavContext } from "@/components/nav/NavbarContext";
import { useUserSettings } from "../UserSettingsContext";

//const NAV_LINKS = [
//  { href: "/dashboard", label: "Dashboard" },
//  { href: "/uploads", label: "Uploads" },
//  { href: "/relational-ui", label: "Data" },
//  { href: "/analytics", label: "Analytics" },
//  { href: "/assistant", label: "Assistant" },
//  { href: "/profile", label: "Profile" },
//];

export default function MobileDrawerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showNav: menuOpen, setShowNav: setMenuOpen } = useNavContext();
  const [isLandscape, setIsLandscape] = useState(false);
  const { userRole } = useUserSettings();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden", "menu-open");
    } else {
      document.body.classList.remove("overflow-hidden", "menu-open");
    }
    return () => document.body.classList.remove("overflow-hidden", "menu-open");
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [router, setMenuOpen]);

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // Styling
  const navPaddingTop = isLandscape ? "pt-2" : "pt-12";
  const navPaddingBottom = isLandscape ? "pb-2" : "pb-5";
  const linkSpacing = isLandscape ? "mb-1" : "mb-2";
  const linkPaddingY = isLandscape ? "py-2" : "py-3";
  const linkPaddingX = "px-4";

  if (!isAuthenticated) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    // Conditionally include uploads based on user permissions
    ...(userRole?.canUploadFiles ? [{ href: "/uploads", label: "Uploads" }] : []),
    { href: "/relational-ui", label: "Spreadsheets" },
    { href: "/analytics", label: "Analytics" },
    { href: "/assistant", label: "AI Assistant" },
    // Conditionally include user management for users with appropriate roles
    ...(userRole?.canManageUsers || userRole?.canInviteUsers ? [{ href: "/users", label: "Users" }] : []),
    { href: "/profile", label: "Profile" },
  ];

  return (
    <>
      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-80 max-w-[90vw]
          bg-white/95 dark:bg-gray-950/95
          shadow-2xl border-l border-gray-200 dark:border-gray-800
          z-[100] flex flex-col
          transition-transform duration-300 ease-in-out
          backdrop-blur-xl
          ${menuOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{
          transitionProperty: "transform, box-shadow, background-color",
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          tabIndex={0}
        >
          <FaTimes className="text-2xl" />
        </button>

        {/* Nav links */}
        <div
          className={`flex-1 flex flex-col overflow-y-auto px-6 ${navPaddingTop} ${navPaddingBottom}`}
        >
          {navItems.map(({ href, label }) => (
            <Link
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
              className={`
                block w-full ${linkPaddingX} ${linkPaddingY} rounded-lg ${linkSpacing} font-semibold
                transition-all duration-200
                active:scale-95
                shadow-sm
                ${
                  isActive(href)
                    ? "bg-blue-600/90 text-white dark:bg-blue-600"
                    : "text-gray-900 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                }
              `}
              style={
                isActive(href)
                  ? { border: "2px solid #2563eb" }
                  : {}
              }
            >
              {label}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between mt-auto">
            <span className="font-medium text-gray-400 dark:text-gray-500">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Sticky Logout Button */}
        <div
          className={`px-6 pt-2 ${isLandscape ? "mt-auto pb-12" : ""}`}
          style={
            isLandscape
              ? {}
              : { paddingBottom: "max(7.5rem, env(safe-area-inset-bottom, 6rem))" }
          }
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              localStorage.clear();
              router.push("/login");
            }}
            className="
              w-full flex items-center justify-center gap-2
              min-h-[48px]
              py-2
              rounded-xl
              font-bold text-base
              bg-gradient-to-r from-red-500 to-rose-600
              text-white shadow-lg
              hover:from-red-600 hover:to-rose-700
              active:scale-98
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-red-300
            "
            style={{
              boxShadow: "0 6px 32px 0 rgba(244, 63, 94, 0.20)",
            }}
          >
            <FaSignOutAlt className="text-lg" />
            Log Out
          </button>
        </div>
      </div>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
