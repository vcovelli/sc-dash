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
  canUploadFiles: boolean;
  canManageUsers: boolean;
  canInviteUsers: boolean;
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
  isLoading: boolean;
}

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
  updateSetting: () => {},
  userRole: null,
  isLoading: true,
});

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from backend and set up user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/accounts/me/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Load settings from backend, fall back to localStorage if no backend settings
          let userSettings = defaultSettings;
          if (userData.settings && Object.keys(userData.settings).length > 0) {
            userSettings = { ...defaultSettings, ...userData.settings };
          } else {
            // Fall back to localStorage
            try {
              const stored = localStorage.getItem("userSettings");
              if (stored) {
                userSettings = { ...defaultSettings, ...JSON.parse(stored) };
              }
            } catch (error) {
              console.warn('Failed to parse localStorage settings:', error);
            }
          }
          
          setSettings(userSettings);
          
          // Define role-based permissions
          const managerAndAboveRoles = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager', 'local_manager'];
          const systemColumnsRoles = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager', 'analyst'];
          const inviteRoles = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager'];
          const manageUsersRoles = ['admin', 'owner'];
          
          setUserRole({
            role: userData.role,
            canViewSystemColumns: systemColumnsRoles.includes(userData.role),
            canUploadFiles: managerAndAboveRoles.includes(userData.role),
            canManageUsers: manageUsersRoles.includes(userData.role),
            canInviteUsers: inviteRoles.includes(userData.role),
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fall back to localStorage if backend fails
        try {
          const stored = localStorage.getItem("userSettings");
          if (stored) {
            setSettings({ ...defaultSettings, ...JSON.parse(stored) });
          }
        } catch (localError) {
          console.warn('Failed to parse localStorage settings:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Persist settings to backend and localStorage
  const persistSettings = async (newSettings: UserSettings) => {
    // Always update localStorage as backup
    localStorage.setItem("userSettings", JSON.stringify(newSettings));
    
    // Try to persist to backend
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch('/api/accounts/me/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: newSettings
        }),
      });
      
      if (!response.ok) {
        console.warn('Failed to persist settings to backend');
      }
    } catch (error) {
      console.error('Error persisting settings to backend:', error);
    }
  };

  // Helper to update single setting field
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    persistSettings(newSettings);
  };

  // Enhanced setSettings that also persists
  const setSettingsWithPersistence = (newSettingsOrUpdater: UserSettings | ((prev: UserSettings) => UserSettings)) => {
    const newSettings = typeof newSettingsOrUpdater === 'function' 
      ? newSettingsOrUpdater(settings) 
      : newSettingsOrUpdater;
    setSettings(newSettings);
    persistSettings(newSettings);
  };

  return (
    <UserSettingsContext.Provider value={{ 
      settings, 
      setSettings: setSettingsWithPersistence, 
      updateSetting, 
      userRole,
      isLoading 
    }}>
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
