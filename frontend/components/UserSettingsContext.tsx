"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserSettings {
  currencyCode: string;
  fontSize: string;
  theme: "light" | "dark" | "system";
  timezone?: string;
}

const defaultSettings: UserSettings = {
  currencyCode: "USD",
  fontSize: "base", // e.g. medium font size preset
  theme: "system",
  timezone: "America/New_York", 
};

interface UserSettingsContextType {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  updateSetting: () => {},
});

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Load saved settings from localStorage if any
    try {
      const stored = localStorage.getItem("userSettings");
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  // Helper to update single setting field
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings, updateSetting }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

// Custom hook for ease of use
export const useUserSettings = (): UserSettingsContextType => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
};
