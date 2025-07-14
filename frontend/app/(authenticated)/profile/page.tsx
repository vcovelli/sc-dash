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
                {/* Avatar, username, email, role, actions */}
                <ProfileInfoCard user={user} hideCard />
              </div>
              {/* Divider */}
              <div className="w-full border-t border-gray-200 dark:border-gray-800 my-6" />
              {/* Plan section */}
              <div className="flex flex-col items-center w-full">
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</span>
                <span className="font-semibold text-lg mb-3 text-blue-700 dark:text-blue-300">{user.plan_display || "Free"}</span>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  // Call your plan upgrade handler here!
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

          {/* Settings (Always Open) */}
          <GlassCard className="p-3 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              <h3
                className="font-bold text-gray-800 dark:text-white text-lg"
                style={{ fontSize: "var(--h2)" }}
              >
                Settings
              </h3>
            </div>
            <SettingsPanel settings={settings} updateSetting={updateSetting} />
          </GlassCard>

          {/* Cancellation Note */}
          <p
            className="text-xs text-gray-400 dark:text-gray-500 text-center"
            style={{ fontSize: "var(--small)" }}
          >
            Want to cancel your plan? Contact support or manage your plan{" "}
            <a
              href="/profile/plans"
              className="underline text-blue-500 dark:text-blue-400"
            >
              here
            </a>
            .
          </p>

          {/* Settings Modal */}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </FontSizeVarsProvider>
  );
}
