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
      <p 
        className="text-center py-10 text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--body)" }}
      >
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
          flex justify-center items-start py-3 sm:py-6 lg:py-10 px-2 sm:px-4
        "
        style={{ fontSize: "var(--body)" }}
      >
        <div 
          className="w-full max-w-3xl mx-auto"
          style={{ 
            gap: `calc(var(--body) * 0.75)`,
            display: 'flex',
            flexDirection: 'column'
          }}
        >

          {/* Header + Settings */}
          <ProfileHeader onShowSettings={() => setShowSettings(true)} />

          {/* DESKTOP: Unified Profile & Plan card */}
          <div className="hidden sm:flex">
            <GlassCard 
              className="flex flex-col items-center w-full max-w-2xl mx-auto"
              style={{ padding: `calc(var(--body) * 1.5)` }}
            >
              {/* Profile avatar and info */}
              <div className="flex flex-col items-center w-full">
                <ProfileInfoCard user={user} hideCard />
              </div>
              <div 
                className="w-full border-t border-gray-200 dark:border-gray-800"
                style={{ 
                  marginTop: `calc(var(--body) * 1.0)`,
                  marginBottom: `calc(var(--body) * 1.0)`
                }}
              />
              {/* Plan section */}
              <div className="flex flex-col items-center w-full">
                <span 
                  className="text-gray-500 dark:text-gray-400 mb-1"
                  style={{ fontSize: "var(--small)" }}
                >
                  Plan
                </span>
                <span 
                  className="font-semibold text-blue-700 dark:text-blue-300"
                  style={{ 
                    fontSize: "var(--h2)",
                    marginBottom: `calc(var(--body) * 0.75)`
                  }}
                >
                  {user.plan_display || "Free"}
                </span>
                <button
                  className="bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  style={{ 
                    fontSize: "var(--body)",
                    padding: `calc(var(--body) * 0.5) calc(var(--body) * 1.0)`
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>
            </GlassCard>
          </div>

          {/* MOBILE: Stacked Cards */}
          <div 
            className="flex flex-col sm:hidden"
            style={{ gap: `calc(var(--body) * 0.75)` }}
          >
            <ProfileInfoCard user={user} />
            <PlanInfoCardMobile user={user} />
          </div>

          {/* Usage */}
          <UsageCard user={user} />

          {/* --- SETTINGS CARDS AT BOTTOM --- */}
          <div style={{ gap: `calc(var(--body) * 0.75)`, display: 'flex', flexDirection: 'column' }}>
            {/* Account & App Settings */}
            <GlassCard 
              style={{ padding: `calc(var(--body) * 0.75) calc(var(--body) * 1.0)` }}
              className="sm:p-8"
            >
              <div 
                className="flex items-center gap-2"
                style={{ marginBottom: `calc(var(--body) * 1.0)` }}
              >
                <CogIcon 
                  className="text-blue-600"
                  style={{ 
                    width: `calc(var(--body) * 1.5)`,
                    height: `calc(var(--body) * 1.5)`
                  }}
                />
                <h3 
                  className="font-bold text-gray-800 dark:text-white" 
                  style={{ fontSize: "var(--h2)" }}
                >
                  Settings
                </h3>
              </div>
              {/* User-level global settings (font size, dark mode, etc.) */}
              <SettingsPanel settings={settings} updateSetting={updateSetting} />
            </GlassCard>

            {/* Account security and notifications - coming soon sections */}
            <div 
              className="grid md:grid-cols-2"
              style={{ gap: `calc(var(--body) * 0.75)` }}
            >
              {/* Security */}
              <GlassCard 
                className="flex items-center opacity-60"
                style={{ padding: `calc(var(--body) * 1.0)` }}
              >
                <ShieldCheckIcon 
                  className="text-gray-400"
                  style={{ 
                    width: `calc(var(--body) * 1.25)`,
                    height: `calc(var(--body) * 1.25)`,
                    marginRight: `calc(var(--body) * 0.75)`
                  }}
                />
                <div>
                  <h4 
                    className="font-semibold text-gray-500"
                    style={{ 
                      fontSize: "var(--body)",
                      marginBottom: `calc(var(--body) * 0.25)`
                    }}
                  >
                    Security
                  </h4>
                  <p 
                    className="text-gray-400"
                    style={{ fontSize: "var(--small)" }}
                  >
                    Password, two-factor authentication, and security settings
                  </p>
                  <span 
                    className="ml-2 px-2 py-1 font-medium text-gray-500 bg-gray-100 rounded-full"
                    style={{ fontSize: "var(--small)" }}
                  >
                    Coming Soon
                  </span>
                </div>
              </GlassCard>
              {/* Notifications */}
              <GlassCard 
                className="flex items-center opacity-60"
                style={{ padding: `calc(var(--body) * 1.0)` }}
              >
                <BellIcon 
                  className="text-gray-400"
                  style={{ 
                    width: `calc(var(--body) * 1.25)`,
                    height: `calc(var(--body) * 1.25)`,
                    marginRight: `calc(var(--body) * 0.75)`
                  }}
                />
                <div>
                  <h4 
                    className="font-semibold text-gray-500"
                    style={{ 
                      fontSize: "var(--body)",
                      marginBottom: `calc(var(--body) * 0.25)`
                    }}
                  >
                    Notifications
                  </h4>
                  <p 
                    className="text-gray-400"
                    style={{ fontSize: "var(--small)" }}
                  >
                    Configure email and in-app notifications
                  </p>
                  <span 
                    className="ml-2 px-2 py-1 font-medium text-gray-500 bg-gray-100 rounded-full"
                    style={{ fontSize: "var(--small)" }}
                  >
                    Coming Soon
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Cancellation Note */}
          <p
            className="text-gray-400 dark:text-gray-500 text-center"
            style={{ 
              fontSize: "var(--small)",
              marginTop: `calc(var(--body) * 0.5)`
            }}
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
