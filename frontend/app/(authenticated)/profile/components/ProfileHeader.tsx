"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import React from "react";

export default function ProfileHeader({ onShowSettings }: { onShowSettings: () => void }) {
  return (
    <div className="flex justify-between items-center mb-2 sm:mb-3 px-1">
      <h2
        className="font-bold text-gray-800 dark:text-white flex items-center gap-2"
        style={{ fontSize: "var(--h1)" }}
      >
        Profile
      </h2>
      <button
        onClick={onShowSettings}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Open Settings"
      >
        <Cog6ToothIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
      </button>
    </div>
  );
}
