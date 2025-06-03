"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { ThemeToggle } from "@/components/ThemeToggle"; // Adjust path if needed

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

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [router]);

  return (
    <nav className="w-full px-4 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-[52px] relative">
        {/* Branding */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
        >
          SupplyWise
        </Link>

        {/* Hamburger (mobile only) */}
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
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Dashboard</Link>
            <Link href="/uploads" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Uploads</Link>
            <Link href="/relational-ui" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Data</Link>
            <Link href="/analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Analytics</Link>
            <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Profile</Link>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
            >
              <FaSignOutAlt className="mr-1" />
              Log Out
            </button>
          </div>
        )}

        {/* Mobile Drawer Nav */}
        {isAuthenticated && (
          <div
            className={`
              fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-950 shadow-2xl transition-transform duration-300 z-50
              flex flex-col gap-4 p-8 pt-20 text-base font-semibold
              ${menuOpen ? "translate-x-0" : "translate-x-full"}
              md:hidden
            `}
            style={{ minWidth: "220px" }}
          >
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link href="/uploads" className="hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Uploads</Link>
            <Link href="/relational-ui" className="hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Data</Link>
            <Link href="/analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Analytics</Link>
            <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Profile</Link>
            <div className="my-2">
              <ThemeToggle />
            </div>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="flex items-center text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition"
            >
              <FaSignOutAlt className="mr-2" />
              Log Out
            </button>
          </div>
        )}

        {/* Overlay when menu open */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </nav>
  );
}
