"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaSignOutAlt } from "react-icons/fa";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
    };

  return (
    <nav className="w-full px-6 py-4 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Branding */}
        <Link href="/" className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition">
          SupplyWise
        </Link>

        {/* Navigation Links */}
        <div className="flex space-x-6 text-sm font-medium text-gray-700">
          <Link
            href="/dashboard"
            className="hover:text-blue-600 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/uploads"
            className="hover:text-blue-600 transition"
          >
            Uploads
          </Link>
          <Link
            href="/analytics"
            className="hover:text-blue-600 transition"
          >
            Analytics
          </Link>
          <Link
            href="/profile"
            className="hover:text-blue-600 transition"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 hover:text-red-600 transition"
          >
            <FaSignOutAlt className="mr-1" />
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}
