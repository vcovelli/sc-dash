"use client";
import DashboardPage from "./DashboardPage";
import FontSizeVarsProvider, { getFontVars } from "@/components/settings/font/FontSizeVarsProvider";
import { useUserSettings } from "@/components/UserSettingsContext";

export default function Page() {
  const { settings, isLoading } = useUserSettings();

  // Show a loading spinner until settings load:
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="text-lg text-gray-500">Loading your dashboard…</span>
      </div>
    );
  }

  const fontVars = getFontVars(settings.fontSize);

  return (
    <FontSizeVarsProvider value={fontVars}>
      <DashboardPage />
    </FontSizeVarsProvider>
  );
}
