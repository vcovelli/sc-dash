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
import { 
  CogIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  UserCircleIcon,
  ChartBarIcon,
  StarIcon,
  CheckCircleIcon 
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

      <p 
        className="text-center py-10 text-gray-500 dark:text-gray-400"
        style={{ fontSize: "var(--body)" }}
      >
        Loading profile...
      </p>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
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
          bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
          dark:from-gray-950 dark:via-gray-900 dark:to-gray-800
          transition-all duration-700
        "
        style={{ fontSize: "var(--body)" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Header Section */}
          <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Manage your account settings and preferences
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <CogIcon className="w-5 h-5 mr-2" />
                  Settings
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
          </div>

          {/* Main Content */}
          <div className="px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Profile & Plan */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Profile Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
                          <p className="text-blue-100 mb-3">{user.email}</p>
                          {user.role && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white border border-white/30">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              {user.role === 'owner' ? 'Organization Owner' : user.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex space-x-4">
                        <Link
                          href="/auth/change-password"
                          className="flex-1 text-center py-2 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Change Password
                        </Link>
                        <Link
                          href="/auth/change-email"
                          className="flex-1 text-center py-2 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Change Email
                        </Link>
                      </div>
                    </div>
                  </div>

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
                  {/* Usage Analytics Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
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
                        {user.plan || 'Free'} Plan
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
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
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.min(100, ((user.usage ?? 0) / (user.usage_quota ?? 1000)) * 100)}%`
                          }}
                        />
                      </div>
                      
                      {user.days_left && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {user.days_left} days left on trial
                          </span>
                          <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200">
                            Upgrade Now →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Settings Panel */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                        <CogIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
                      </div>
                    </div>
                    <SettingsPanel settings={settings} updateSetting={updateSetting} />
                  </div>
                </div>

                {/* Right Column - Plan & Quick Actions */}
                <div className="space-y-8">
                  {/* Plan Card */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Current Plan</h3>
                        <StarIcon className="w-6 h-6 text-yellow-300" />
                      </div>
                      <div className="mb-6">
                        <div className="text-3xl font-bold mb-2">{user.plan_display || "Free"}</div>
                        <p className="text-blue-100 text-sm">Perfect for getting started</p>
                      </div>
                      <button className="w-full bg-white text-blue-600 font-semibold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer opacity-60">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-500">Security Settings</div>
                          <div className="text-xs text-gray-400">Two-factor authentication</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">Soon</span>
                      </div>
                      
                      <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer opacity-60">
                        <BellIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-500">Notifications</div>
                          <div className="text-xs text-gray-400">Email and app alerts</div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">Soon</span>
                      </div>
                    </div>
                  </div>

                  {/* Support Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Our support team is here to help you get the most out of SupplyWise.
                    </p>
                    <div className="space-y-2">
                      <Link
                        href="/profile/plans"
                        className="block w-full text-center py-2 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        Manage Plan
                      </Link>
                      <button className="block w-full text-center py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

        {/* Settings Modal */}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </FontSizeVarsProvider>
  );
}
