"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { ThemeToggle } from "@/components/settings/theme/ThemeToggle";
import { useNavContext } from "@/components/nav/NavbarContext";
import HamburgerButton from "@/components/nav/HamburgerButton"; // Make sure you import it!
import { useUserSettings } from "../UserSettingsContext";

//const NAV_LINKS = [
//  { href: "/dashboard", label: "Dashboard" },
//  { href: "/uploads", label: "Uploads" },
//  { href: "/relational-ui", label: "Data" },
//  { href: "/analytics", label: "Analytics" },
//  { href: "/assistant", label: "Assistant" },
//  { href: "/profile", label: "Profile" },
//];

export default function DesktopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showDesktopNav } = useNavContext();
  const { userRole } = useUserSettings();
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    // Conditionally include uploads based on user permissions
    ...(userRole?.canUploadFiles ? [{ href: "/uploads", label: "Uploads" }] : []),
    { href: "/relational-ui", label: "Data Tables" },
    { href: "/analytics", label: "Analytics" },
    { href: "/assistant", label: "AI Assistant" },
    { href: "/profile", label: "Profile" },
  ];

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const activeLink =
    "bg-blue-600 text-white dark:bg-blue-600 dark:text-white font-bold shadow";
  const inactiveLink =
    "text-gray-800 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-700 dark:hover:text-blue-300 dark:hover:bg-blue-950";

  if (!showDesktopNav) return null;

  // Show the embedded hamburger only on /relational-ui (including subroutes)
  const isRelationalUI = pathname.startsWith("/relational-ui");

  return (
    <nav className="w-full px-4 bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors z-50 h-[52px] flex items-center">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
        {/* Left: Logo */}
        <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition"
        >
            SupplyWise
        </Link>

        {/* Right: nav links, theme, logout, (and hamburger for /relational-ui) */}
        {isAuthenticated && (
            <div className="flex items-center space-x-2 text-sm font-medium">
            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-2">
                {navItems.map(({ href, label }) => (
                <Link
                    href={href}
                    key={href}
                    className={`px-4 py-2 rounded-lg transition-all ${
                    isActive(href) ? activeLink : inactiveLink
                    }`}
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
            {/* Embedded HamburgerButton ONLY on /relational-ui, ONLY on mobile/tablet */}
            {isRelationalUI && (
            <div className="md:hidden flex items-center">
                <HamburgerButton embedded />
            </div>
            )}
            </div>
        )}
        </div>
    </nav>
    );
}
