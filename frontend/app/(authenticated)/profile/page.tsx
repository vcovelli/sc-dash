"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import OutsideClickModal from "@/components/OutsideClickModal";
import {
  FaUserEdit, FaEnvelope, FaKey, FaClock, FaTrashAlt,
  FaDollarSign, FaFont, FaAdjust
} from "react-icons/fa";
import { useUserSettings } from "@/components/UserSettingsContext";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";

// ---- Option arrays ----
const timezones = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "UTC", label: "UTC" },
];
const currencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "Pound Sterling (GBP)" },
  { value: "JPY", label: "Yen (JPY)" },
];
const themes = [
  { value: "light", label: <>🌞 Light</> },
  { value: "dark", label: <>🌙 Dark</> },
  { value: "system", label: <>🖥️ System</> },
];

export default function ProfilePage() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<null | {
    username: string;
    email: string;
    plan: string;
    joined: string;
    uploads: number;
    usage: number;
    usage_quota: number;
    days_left: number;
  }>(null);

  // ------- USE GLOBAL SETTINGS CONTEXT ---------
  const { settings, updateSetting } = useUserSettings();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    fetchUserProfile();
  }, []);

  if (!user)
    return (
      <p className="text-center py-10 text-gray-500 dark:text-gray-400">
        Loading profile...
      </p>
    );

  // ==== MAIN PAGE STARTS HERE ====
  return (
    <FontSizeVarsProvider>

    <div className="
      min-h-screen w-full
      bg-gradient-to-br from-blue-50 to-indigo-100
      dark:from-gray-900 dark:to-gray-950
      transition-colors duration-500
      flex justify-center items-start py-6 sm:py-10 px-1 sm:px-2
    "
      style={{ fontSize: "var(--body)" }}
    >
      <div className="w-full max-w-3xl space-y-5 sm:space-y-8">

        {/* Header + Settings */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 px-1">
          <h2
            className="font-bold text-gray-800 dark:text-white flex items-center gap-2"
            style={{ fontSize: "var(--h1)" }}
          >
            Profile
          </h2>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Open Settings"
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        {/* PROFILE + PLAN */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Profile Info */}
          <GlassCard className="flex-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-white rounded-full flex items-center justify-center font-bold text-2xl shadow"
              style={{ fontSize: "var(--h2)" }} // << user icon letter
            >
              {user.username[0]?.toUpperCase()}
            </div>
            <div className="flex-1 w-full">
              <h3
                className="font-semibold text-gray-900 dark:text-white mb-1"
                style={{ fontSize: "var(--h2)" }}
              >
                {user.username}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base break-all"
                style={{ fontSize: "var(--body)" }}>
                {user.email}
              </p>
              <div className="mt-1 sm:mt-2 flex flex-wrap gap-2">
                <a href="/auth/change-password" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  style={{ fontSize: "var(--small)" }}>
                  Change Password
                </a>
                <a href="/auth/change-email" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  style={{ fontSize: "var(--small)" }}>
                  Change Email
                </a>
              </div>
            </div>
            {/* Plan Info (show inline for desktop, below on mobile) */}
            <div className="hidden sm:flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-gray-500 dark:text-gray-400 text-sm"
                style={{ fontSize: "var(--small)" }}>
                Plan
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg"
                style={{ fontSize: "var(--body)" }}>
                {user.plan}
              </span>
              <button
                onClick={() => router.push("/profile/plans")}
                className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
                style={{ fontSize: "var(--small)" }}
              >
                {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
              </button>
            </div>
          </GlassCard>
          {/* Plan Info (mobile, stacked) */}
          <div className="sm:hidden">
            <GlassCard className="flex flex-col items-center py-2 px-4 mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm"
                style={{ fontSize: "var(--small)" }}>
                Plan
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-lg"
                style={{ fontSize: "var(--body)" }}>
                {user.plan}
              </span>
              <button
                onClick={() => router.push("/profile/plans")}
                className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow"
                style={{ fontSize: "var(--small)" }}
              >
                {user.plan === "Free" ? "Upgrade to Pro" : "Manage Plan"}
              </button>
            </GlassCard>
          </div>
        </div>

        {/* Usage Card */}
        <GlassCard className="p-4 sm:p-8 mt-0">
          <div className="font-semibold text-gray-700 dark:text-gray-100 mb-2 flex items-center gap-2"
            style={{ fontSize: "var(--body)" }}>
            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-900"
              style={{ fontSize: "var(--small)" }}>
              {user.plan} Plan
            </span>
            Usage
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100"
              style={{ fontSize: "var(--h2)" }}>
              {(user.usage ?? 0).toLocaleString()}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm"
              style={{ fontSize: "var(--body)" }}>
              / {(user.usage_quota ?? 0).toLocaleString()} rows used
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1">
            <div
              className="h-2 bg-green-400 dark:bg-green-600 rounded transition-all"
              style={{
                width: `${Math.min(100, (user.usage / user.usage_quota) * 100)}%`
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400"
            style={{ fontSize: "var(--small)" }}>
            {user.days_left} days left on trial – <span className="underline text-blue-600 dark:text-blue-300 cursor-pointer">Upgrade Now</span>
          </p>
        </GlassCard>

        {/* Settings Card (Always Open) */}
        <GlassCard className="p-3 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg" style={{ fontSize: "var(--h2)" }}>
              Settings
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <SettingSelect
              label="Timezone"
              icon={<FaClock className="text-blue-500" />}
              value={settings.timezone || "America/New_York"}
              options={timezones}
              onChange={val => updateSetting("timezone", val)}
            />
            <SettingSelect
              label="Default Currency"
              icon={<FaDollarSign className="text-green-500" />}
              value={settings.currencyCode || "USD"}
              options={currencies}
              onChange={val => updateSetting("currencyCode", val)}
            />
            <SettingSelect
              label="Theme"
              icon={<FaAdjust className="text-indigo-500" />}
              value={settings.theme || "system"}
              options={themes}
              onChange={val => updateSetting("theme", val as "light" | "dark" | "system")}
            />
            <SettingSelect
              label="Font Size"
              icon={<FaFont className="text-yellow-500" />}
              value={settings.fontSize || "base"}
              options={[
                { value: "sm", label: "Small (12px)" },
                { value: "base", label: "Default (14px)" },
                { value: "lg", label: "Large (16px)" },
                { value: "xl", label: "Extra Large (18px)" },
              ]}
              onChange={val => updateSetting("fontSize", val)}
            />
          </div>
        </GlassCard>

        {/* Cancellation Note */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center"
          style={{ fontSize: "var(--small)" }}>
          Want to cancel your plan? Contact support or manage your plan{" "}
          <a href="/profile/plans" className="underline text-blue-500 dark:text-blue-400">
            here
          </a>.
        </p>

        {/* Settings Modal */}
        {showSettings && (
          <OutsideClickModal onClose={() => setShowSettings(false)}>
            <div className="relative bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-900/30 rounded-2xl shadow-2xl px-8 py-8 w-full max-w-md text-gray-800 dark:text-gray-100 ring-1 ring-black/10 dark:ring-white/10"
              style={{ fontSize: "var(--body)" }}>
              {/* Close Button */}
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-2xl"
                onClick={() => setShowSettings(false)}
                aria-label="Close"
              >
                ✕
              </button>
              {/* Header */}
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"
                style={{ fontSize: "var(--h2)" }}>
                <span className="text-blue-600 dark:text-blue-400">⚙️</span> Settings
              </h3>
              <div className="space-y-3">
                <ModalItem icon={<FaUserEdit />} label="Change Username" />
                <ModalItem icon={<FaEnvelope />} label="Change Email" />
                <ModalItem icon={<FaKey />} label="Reset Password" />
              </div>
              <hr className="my-6 border-gray-200 dark:border-gray-700" />
              <button className="flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900 text-red-600 font-semibold"
                style={{ fontSize: "var(--body)" }}>
                <FaTrashAlt /> Delete Account
              </button>
            </div>
          </OutsideClickModal>
        )}
      </div>
    </div>
    </FontSizeVarsProvider>
  );
}

// --- Glass Card (matches dashboard) ---
function GlassCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-xl border border-white/20 dark:border-gray-900/30 backdrop-blur-xl ${className}`}
      style={{ fontSize: "inherit" }}>
      {children}
    </div>
  );
}

// --- Preferences Select Input ---
function SettingSelect({
  label, icon, value, options, onChange
}: {
  label: string,
  icon: React.ReactNode,
  value: string,
  options: { value: string, label: React.ReactNode }[],
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-1"
        style={{ fontSize: "var(--body)" }}>
        {icon} {label}
      </label>
      <select
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 py-3 px-4 text-base shadow focus:ring-2 focus:ring-blue-400 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ fontSize: "var(--body)" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// --- Settings Modal Item ---
function ModalItem({ icon, label, disabled }: { icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded
        ${disabled
          ? "opacity-60 cursor-not-allowed hover:bg-transparent"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium"
        }`}
      disabled={disabled}
      style={{ fontSize: "var(--body)" }}
    >
      {icon} {label}
    </button>
  );
}
