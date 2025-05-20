"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import OutsideClickModal from "@/components/OutsideClickModal";

export default function ProfilePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<null | {
    username: string;
    email: string;
    plan: string;
    joined: string;
    uploads: number;
  }>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    fetchUserProfile();
  }, []);

  const getFormattedJoinDate = () => {
    try {
      if (!user?.joined) return "N/A";
      return format(new Date(user.joined), "MMMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  if (!user)
    return (
      <p className="text-center py-10 text-gray-500 dark:text-gray-400">
        Loading profile...
      </p>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header + Settings Icon */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-white">
          👤 Your Profile
        </h2>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
          aria-label="Open Settings"
        >
          <Cog6ToothIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-800 shadow-lg rounded-xl p-6 mb-8 transition-all duration-300">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-white rounded-full flex items-center justify-center font-bold text-xl">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {user.username}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
            <div className="mt-2 flex space-x-4">
              <a
                href="/auth/change-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change Password
              </a>
              <a
                href="/auth/change-email"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Change Email
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Plan Card */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow text-center flex flex-col justify-between h-full">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Plan</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.plan}</p>
          </div>
          <button
            onClick={() => router.push("/profile/plans")}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
          >
            {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
          </button>
        </div>

        {/* Joined Date */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow text-center flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Joined</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{getFormattedJoinDate()}</p>
        </div>

        {/* Uploads */}
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow text-center flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Uploads</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{user.uploads}</p>
        </div>
      </div>

      {/* Cancellation Note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Want to cancel your plan? Contact support or manage your plan{" "}
        <a href="/profile/plans" className="underline text-blue-500 dark:text-blue-400">
          here
        </a>.
      </p>

      {/* Settings Modal with outside click support */}
      {showSettings && (
        <OutsideClickModal onClose={() => setShowSettings(false)}>
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-black dark:hover:text-white text-xl"
            onClick={() => setShowSettings(false)}
          >
            ✕
          </button>
          <h3 className="text-2xl font-bold mb-4">⚙️ Settings</h3>

          <div className="space-y-4 text-sm">
            <button className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline">
              Change Username
            </button>
            <button className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline">
              Change Email
            </button>
            <button className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline">
              Reset Password
            </button>
            <button className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline">
              Set Timezone (Coming Soon)
            </button>
            <button className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline">
              Toggle Dark/Light Mode (Coming Soon)
            </button>
            <button className="w-full text-left text-red-500 hover:underline">
              Delete Account
            </button>
          </div>
        </OutsideClickModal>
      )}
    </div>
  );
}
