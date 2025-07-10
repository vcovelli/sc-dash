"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserSettings {
  currencyCode: string;
  fontSize: string;
  theme: "light" | "dark" | "system";
  timezone?: string;
  showSystemColumns: boolean;
}

export interface UserRole {
  role: string;
  canViewSystemColumns: boolean;
}

const defaultSettings: UserSettings = {
  currencyCode: "USD",
  fontSize: "base", // e.g. medium font size preset
  theme: "system",
  timezone: "America/New_York",
  showSystemColumns: false,
};

interface UserSettingsContextType {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  userRole: UserRole | null;
}

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  updateSetting: () => {},
  userRole: null,
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

  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Fetch user role on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch('/api/accounts/me/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          const canViewSystemColumns = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager', 'analyst'].includes(userData.role);
          setUserRole({
            role: userData.role,
            canViewSystemColumns
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  // Helper to update single setting field
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <UserSettingsContext.Provider value={{ settings, setSettings, updateSetting, userRole }}>
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
