"use client";

import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import React from "react";

export default function ProfileHeader({ onShowSettings }: { onShowSettings: () => void }) {
  return (
    <div 
      className="flex justify-between items-center px-1"
      style={{ 
        marginBottom: `calc(var(--body) * 0.5)`,
        gap: `calc(var(--body) * 0.5)`
      }}
    >
      <h2
        className="font-bold text-gray-800 dark:text-white flex items-center"
        style={{ 
          fontSize: "var(--h1)",
          gap: `calc(var(--body) * 0.5)`
        }}
      >
        Profile
      </h2>
      <button
        onClick={onShowSettings}
        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Open Settings"
        style={{ padding: `calc(var(--body) * 0.5)` }}
      >
        <Cog6ToothIcon 
          className="text-gray-500 dark:text-gray-300"
          style={{ 
            height: `calc(var(--body) * 1.5)`,
            width: `calc(var(--body) * 1.5)`
          }}
        />
      </button>
    </div>
  );
}
