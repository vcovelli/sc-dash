"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import OutsideClickModal from "@/components/OutsideClickModal";
import { FaUserEdit, FaEnvelope, FaKey, FaClock, FaTrashAlt } from "react-icons/fa";

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
    <div className="flex justify-center items-start min-h-[88vh] py-14 px-2 bg-transparent">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header + Settings Icon */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="text-3xl">👤</span> Your Profile
          </h2>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open Settings"
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 flex items-center gap-6 transition-all duration-300">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-white rounded-full flex items-center justify-center font-bold text-2xl shadow">
            {user.username[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          <StatCard
            label="Plan"
            value={<span className="text-blue-600 dark:text-blue-400 font-bold">{user.plan}</span>}
            buttonLabel={user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
            onButtonClick={() => router.push("/profile/plans")}
          />
          <StatCard label="Joined" value={getFormattedJoinDate()} />
          <StatCard label="Uploads" value={user.uploads} />
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
            <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl px-8 py-8 w-full max-w-md text-gray-800 dark:text-gray-100 ring-1 ring-black/10 dark:ring-white/10">
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
                onClick={() => setShowSettings(false)}
                aria-label="Close"
              >
                ✕
              </button>

              {/* Header */}
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">⚙️</span> Settings
              </h3>

              <div className="space-y-3">
                <ModalItem icon={<FaUserEdit />} label="Change Username" />
                <ModalItem icon={<FaEnvelope />} label="Change Email" />
                <ModalItem icon={<FaKey />} label="Reset Password" />
                <ModalItem icon={<FaClock />} label="Set Timezone (Coming Soon)" disabled />
              </div>

              {/* Divider & Danger Zone */}
              <hr className="my-6 border-gray-200 dark:border-gray-700" />

              <button className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900 text-red-600 font-semibold">
                <FaTrashAlt /> Delete Account
              </button>
            </div>
          </OutsideClickModal>
        )}
      </div>
    </div>
  );
}

// Stat Card Component for Profile Stats
function StatCard({
  label,
  value,
  buttonLabel,
  onButtonClick,
}: {
  label: string;
  value: string | number | JSX.Element;
  buttonLabel?: string;
  onButtonClick?: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow flex flex-col items-center justify-center text-center p-6 min-h-[120px] transition-all">
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      {buttonLabel && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow"
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

// Settings Modal Item
function ModalItem({ icon, label, disabled }: { icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded
        ${disabled
          ? "opacity-60 cursor-not-allowed hover:bg-transparent"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium"
        }`}
      disabled={disabled}
    >
      {icon} {label}
    </button>
  );
}
