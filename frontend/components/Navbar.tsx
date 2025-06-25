"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [router]);

  return (
    <nav className="w-full px-4 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-[52px] relative">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition">
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

        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Dashboard</Link>
            <Link href="/uploads" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Uploads</Link>
            <Link href="/relational-ui" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Data</Link>
            <Link href="/analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Analytics</Link>
            <Link href="/assistant" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Assistant</Link>
            <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Profile</Link>
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition">
              <FaSignOutAlt className="mr-1" /> Log Out
            </button>
          </div>
        )}

        {/* Mobile Drawer Nav */}
        {isAuthenticated && (
          <div className={`fixed top-0 right-0 h-screen w-72 bg-white dark:bg-gray-950 shadow-2xl transition-transform duration-300 z-[100] flex flex-col justify-between p-6 text-base font-semibold ${menuOpen ? "translate-x-0" : "translate-x-full"} md:hidden`}>
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <FaTimes className="text-xl" />
            </button>
            {/* Nav links - scrollable if needed */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-5 text-gray-800 dark:text-gray-100 pt-16 pb-6">
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block">Dashboard</Link>
                <Link href="/uploads" onClick={() => setMenuOpen(false)} className="block">Uploads</Link>
                <Link href="/relational-ui" onClick={() => setMenuOpen(false)} className="block">Data</Link>
                <Link href="/analytics" onClick={() => setMenuOpen(false)} className="block">Analytics</Link>
                <Link href="/assistant" onClick={() => setMenuOpen(false)} className="block">Assistant</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block">Profile</Link>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <ThemeToggle />
                </div>
              </div>
            </div>
            {/* Logout button pinned with bottom padding */}
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="mt-6 mb-2 flex items-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
              style={{ paddingBottom: "env(safe-area-inset-bottom,1.25rem)" }}
            >
              <FaSignOutAlt className="mr-2" /> Log Out
            </button>
          </div>
        )}

        {/* Overlay when menu open */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
