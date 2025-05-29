"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { ThemeToggle } from "@/components/ThemeToggle"; // Adjust path if needed

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <nav className="w-full px-6 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-[48px]">
        {/* Branding */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
        >
          SupplyWise
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <div className="flex items-center space-x-6 text-sm font-medium text-gray-700 dark:text-gray-200">
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Dashboard
            </Link>
            <Link href="/uploads" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Uploads
            </Link>
            <Link href="/relational-ui" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Data
            </Link>
            <Link href="/analytics" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Analytics
            </Link>
            <Link href="/profile" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Profile
            </Link>
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
      </div>
    </nav>
  );
}
