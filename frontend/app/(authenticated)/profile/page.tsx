"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import ProfileHeader from "./components/ProfileHeader";
import ProfileInfoCard from "./components/ProfileInfoCard";
import PlanInfoCard, { PlanInfoCardMobile } from "./components/PlanInfoCard";
import UsageCard from "./components/UsageCard";
import SettingsPanel from "./components/SettingsPanel";
import SettingsModal from "./components/SettingsModal";
import GlassCard from "./components/GlassCard";
import { useUserSettings } from "@/components/UserSettingsContext";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";
// Optionally, bring in icons from heroicons or your library:
import { CogIcon, ShieldCheckIcon, BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function ProfilePage() {
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<any>(null);
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

  return (
    <FontSizeVarsProvider>
      <div
        className="
          min-h-screen w-full
          bg-gradient-to-br from-blue-50 to-indigo-100
          dark:from-gray-900 dark:to-gray-950
          transition-colors duration-500
          flex justify-center items-start py-6 sm:py-10 px-1 sm:px-2
        "
        style={{ fontSize: "var(--body)" }}
      >
        <div className="w-full max-w-3xl space-y-5 sm:space-y-8 mx-auto">

          {/* Header + Settings */}
          <ProfileHeader onShowSettings={() => setShowSettings(true)} />

          {/* DESKTOP: Unified Profile & Plan card */}
          <div className="hidden sm:flex">
            <GlassCard className="p-8 flex flex-col items-center w-full max-w-2xl mx-auto">
              {/* Profile avatar and info */}
              <div className="flex flex-col items-center w-full">
                <ProfileInfoCard user={user} hideCard />
              </div>
              <div className="w-full border-t border-gray-200 dark:border-gray-800 my-6" />
              {/* Plan section */}
              <div className="flex flex-col items-center w-full">
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</span>
                <span className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">{user.plan_display || "Free"}</span>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  // Add your plan upgrade handler here!
                >
                  Upgrade to Pro
                </button>
              </div>
            </GlassCard>
          </div>

          {/* MOBILE: Stacked Cards */}
          <div className="flex flex-col sm:hidden gap-4">
            <ProfileInfoCard user={user} />
            <PlanInfoCardMobile user={user} />
          </div>

          {/* Usage */}
          <UsageCard user={user} />

          {/* --- SETTINGS CARDS AT BOTTOM --- */}
          <div className="space-y-5">
            {/* Account & App Settings */}
            <GlassCard className="p-3 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <CogIcon className="w-7 h-7 text-blue-600" />
                <h3 className="font-bold text-gray-800 dark:text-white text-lg" style={{ fontSize: "var(--h2)" }}>
                  Settings
                </h3>
              </div>
              {/* User-level global settings (font size, dark mode, etc.) */}
              <SettingsPanel settings={settings} updateSetting={updateSetting} />
            </GlassCard>

            {/* Account security and notifications - coming soon sections */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Security */}
              <GlassCard className="p-4 flex items-center opacity-60">
                <ShieldCheckIcon className="w-6 h-6 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-500 mb-1">Security</h4>
                  <p className="text-gray-400 text-sm">Password, two-factor authentication, and security settings</p>
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </GlassCard>
              {/* Notifications */}
              <GlassCard className="p-4 flex items-center opacity-60">
                <BellIcon className="w-6 h-6 text-gray-400 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-500 mb-1">Notifications</h4>
                  <p className="text-gray-400 text-sm">Configure email and in-app notifications</p>
                  <span className="ml-2 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                    Coming Soon
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Cancellation Note */}
          <p
            className="text-xs text-gray-400 dark:text-gray-500 text-center"
            style={{ fontSize: "var(--small)" }}
          >
            Want to cancel your plan? Contact support or manage your plan{" "}
            <Link
              href="/profile/plans"
              className="underline text-blue-500 dark:text-blue-400"
            >
              here
            </Link>
            .
          </p>

          {/* Settings Modal */}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </FontSizeVarsProvider>
  );
}
