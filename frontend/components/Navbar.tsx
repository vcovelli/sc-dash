"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { ThemeToggle } from "@/components/ThemeToggle";

// Main nav items
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/uploads", label: "Uploads" },
  { href: "/relational-ui", label: "Data" },
  { href: "/analytics", label: "Analytics" },
  { href: "/assistant", label: "Assistant" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Prevent scroll when menu is open
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
  }, [router]);

  // Detect landscape vs portrait
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

  // Returns true if nav item is active
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // Tailwind classes
  const activeLink =
    "bg-blue-600 text-white dark:bg-blue-600 dark:text-white font-bold shadow";
  const inactiveLink =
    "text-gray-800 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-700 dark:hover:text-blue-300 dark:hover:bg-blue-950";

  // Responsive paddings
  const navPaddingTop = isLandscape ? "pt-2" : "pt-12";
  const navPaddingBottom = isLandscape ? "pb-2" : "pb-5";
  const linkSpacing = isLandscape ? "mb-1" : "mb-2";
  const linkPaddingY = isLandscape ? "py-2" : "py-3";
  const linkPaddingX = "px-4";

  return (
    <nav className="w-full px-4 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-[52px] relative">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
        >
          SupplyWise
        </Link>

        {isAuthenticated && (
          <button
            className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <FaTimes className="text-2xl text-gray-700 dark:text-gray-200" />
            ) : (
              <FaBars className="text-2xl text-gray-700 dark:text-gray-200" />
            )}
          </button>
        )}

        {/* Desktop Nav */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-2 text-sm font-medium">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                href={href}
                key={href}
                className={`
                  px-4 py-2 rounded-lg transition-all
                  ${isActive(href) ? activeLink : inactiveLink}
                `}
              >
                {label}
              </Link>
            ))}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition px-4 py-2 font-semibold"
            >
              <FaSignOutAlt className="mr-1" /> Log Out
            </button>
          </div>
        )}

        {/* Mobile Drawer Nav */}
        {isAuthenticated && (
          <div
            className={`
              fixed top-0 right-0 h-screen w-80 max-w-[90vw]
              bg-white/95 dark:bg-gray-950/95
              shadow-2xl border-l border-gray-200 dark:border-gray-800
              z-[100] flex flex-col
              transition-transform duration-300 ease-in-out
              backdrop-blur-xl
              ${menuOpen ? "translate-x-0" : "translate-x-full"}
              md:hidden
            `}
            style={{
              transitionProperty: "transform, box-shadow, background-color",
            }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none"
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
              {NAV_LINKS.map(({ href, label }) => (
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
              className={`px-6 pt-2 ${isLandscape ? "mt-auto pb-10" : ""}`}
              style={
                isLandscape
                  ? {}
                  : { paddingBottom: "max(7.5rem, env(safe-area-inset-bottom, 6rem))" }
              }
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
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
        )}

        {/* Overlay when menu open */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </nav>
  );
}
