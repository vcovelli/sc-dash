"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import GlassCard from "./components/GlassCard";
import ProfileHeader from "./components/ProfileHeader";
import ProfileInfoCard from "./components/ProfileInfoCard";
import PlanInfoCard, { PlanInfoCardMobile } from "./components/PlanInfoCard";
import UsageCard from "./components/UsageCard";
import SettingsPanel from "./components/SettingsPanel";
import SettingsModal from "./components/SettingsModal";
import { useUserSettings } from "@/components/UserSettingsContext";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  ChartBarIcon,
  StarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Loading your profile...</p>
        </div>
      </div>
    );

  return (
    <FontSizeVarsProvider>
      <div
        className="
          min-h-screen w-full
          bg-gradient-to-br from-blue-50 to-indigo-100
          dark:from-gray-900 dark:to-gray-950
          transition-colors duration-500
          flex justify-center items-start py-6 px-2 sm:px-4
        "
        style={{ fontSize: "var(--body)" }}
      >
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {/* Header */}
          <ProfileHeader onShowSettings={() => setShowSettings(true)} />

          {/* Responsive: Mobile stacked, desktop side-by-side */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Left Column */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Profile & Plan Card (glass) */}
              <GlassCard className="flex flex-col items-center w-full p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 w-full text-white flex flex-col items-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30 mb-3">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
                  <p className="text-blue-100 mb-2">{user.email}</p>
                  {user.role && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {user.role === "owner" ? "Organization Owner" : user.role}
                    </span>
                  )}
                </div>
                <div className="p-6 bg-white/80 dark:bg-gray-900/80 w-full flex flex-col items-center">
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Link
                      href="/auth/change-password"
                      className="flex-1 text-center py-2 px-4 bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-900/30 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/90 dark:hover:bg-gray-900 transition-colors duration-200"
                    >
                      Change Password
                    </Link>
                    <Link
                      href="/auth/change-email"
                      className="flex-1 text-center py-2 px-4 bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-900/30 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/90 dark:hover:bg-gray-900 transition-colors duration-200"
                    >
                      Change Email
                    </Link>
                  </div>
                  <div className="border-t border-white/20 dark:border-gray-900/30 my-6 w-full" />
                  {/* Plan Info (just text, no card) */}
                  <div className="flex flex-col items-center w-full">
                    <span className="text-gray-500 dark:text-gray-400 mb-1" style={{ fontSize: "var(--small)" }}>
                      Plan
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300" style={{ fontSize: "var(--h2)" }}>
                      {user.plan_display || "Free"}
                    </span>
                    <button
                      className="bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition mt-2 px-5 py-2"
                      style={{ fontSize: "var(--body)" }}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </GlassCard>

              {/* Usage Analytics Card (glass) */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage Analytics</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track your monthly usage</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                    {user.plan || "Free"} Plan
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {(user.usage ?? 0).toLocaleString()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      of {(user.usage_quota ?? 1000).toLocaleString()} rows
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {Math.round(((user.usage ?? 0) / (user.usage_quota ?? 1000)) * 100)}% used this month
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, ((user.usage ?? 0) / (user.usage_quota ?? 1000)) * 100)}%`,
                      }}
                    />
                  </div>
                  {user.days_left && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/20 dark:border-gray-900/30">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.days_left} days left on trial
                      </span>
                      <button className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                        Upgrade Now →
                      </button>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Preferences Panel (glass) */}
              <GlassCard className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <CogIcon className="text-blue-600" style={{ width: 24, height: 24 }} />
                  <h3 className="font-bold text-gray-800 dark:text-white" style={{ fontSize: "var(--h2)" }}>
                    Settings
                  </h3>
                </div>
                <SettingsPanel settings={settings} updateSetting={updateSetting} />
              </GlassCard>
            </div>

            {/* Side Column for large screens */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Quick Actions (glass) */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-lg border border-white/20 dark:border-gray-900/30 hover:bg-white/60 dark:hover:bg-gray-900/40 transition-colors duration-200 cursor-pointer opacity-60">
                    <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-500">Security Settings</div>
                      <div className="text-xs text-gray-400">Two-factor authentication</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/50 dark:bg-gray-900/50 text-gray-500 rounded-full">Soon</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg border border-white/20 dark:border-gray-900/30 hover:bg-white/60 dark:hover:bg-gray-900/40 transition-colors duration-200 cursor-pointer opacity-60">
                    <BellIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-500">Notifications</div>
                      <div className="text-xs text-gray-400">Email and app alerts</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/50 dark:bg-gray-900/50 text-gray-500 rounded-full">Soon</span>
                  </div>
                </div>
              </GlassCard>
              {/* Support Card (glass) */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Our support team is here to help you get the most out of SupplyWise.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/profile/plans"
                    className="block w-full text-center py-2 px-4 bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-900/30 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/90 dark:hover:bg-gray-900 transition-colors duration-200"
                  >
                    Manage Plan
                  </Link>
                  <button className="block w-full text-center py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                    Contact Support
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Mobile: Stacked PlanInfoCard for small screens */}
          <div className="sm:hidden flex flex-col gap-6">
            <PlanInfoCardMobile user={user} />
          </div>

          {/* Settings Modal */}
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </FontSizeVarsProvider>
  );
}
