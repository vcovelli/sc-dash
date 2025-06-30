// HamburgerButton.tsx
"use client";
import { FaBars } from "react-icons/fa";
import { useNavContext } from "./NavbarContext";

export default function HamburgerButton({ embedded = false }) {
  const { showNav, setShowNav } = useNavContext();
  if (showNav) return null; // Hide when menu is open

  return (
    <button
      className={
        embedded
          ? "p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"
          : "fixed top-2 right-2 z-[101] p-2 rounded-lg bg-white/80 dark:bg-gray-900/80 shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition md:hidden"
      }
      style={embedded ? { marginLeft: 0, marginRight: "0.5rem" } : {}}
      onClick={() => setShowNav(true)}
      aria-label="Open menu"
      type="button"
    >
      <FaBars className={embedded ? "text-2xl" : "text-2xl text-gray-800 dark:text-gray-200"} />
    </button>
  );
}
