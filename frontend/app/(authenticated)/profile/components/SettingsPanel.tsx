import React from "react";
import {
  ClockIcon,
  CurrencyDollarIcon,
  ComputerDesktopIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import FontSizeDropdown from "@/components/settings/font/FontSizeDropdown";
import type { UserSettings } from "@/components/UserSettingsContext";

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
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

interface SettingsPanelProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export default function SettingsPanel({
  settings,
  updateSetting,
}: {
  settings: any;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}) {
  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-2"
      style={{ gap: `calc(var(--body) * 1.0) calc(var(--body) * 1.5)` }}
    >

    <div className="space-y-6">
      {/* Timezone */}
      <SettingItem
        label="Timezone"
        description="Select your local timezone for accurate time display"
        icon={<ClockIcon className="w-5 h-5 text-blue-500" />}
      >
        <SettingSelect
          value={settings.timezone || "America/New_York"}
          options={timezones}
          onChange={val => updateSetting("timezone", val)}
        />
      </SettingItem>

      {/* Currency */}
      <SettingItem
        label="Default Currency"
        description="Choose your preferred currency for pricing display"
        icon={<CurrencyDollarIcon className="w-5 h-5 text-green-500" />}
      >
        <SettingSelect
          value={settings.currencyCode || "USD"}
          options={currencies}
          onChange={val => updateSetting("currencyCode", val)}
        />
      </SettingItem>

      {/* Theme */}
      <SettingSelect
        label="Theme"
        icon={<FaAdjust className="text-indigo-500" />}
        value={settings.theme || "system"}
        options={themes}
        onChange={val => updateSetting("theme", val as "light" | "dark" | "system")}
      />
      {/* Font Size */}
      <div>
        <label 
          className="flex items-center font-semibold text-gray-700 dark:text-gray-200"
          style={{ 
            fontSize: "var(--body)",
            marginBottom: `calc(var(--body) * 0.25)`,
            gap: `calc(var(--body) * 0.5)`
          }}
        >
          <span className="text-yellow-500"><FaFont /></span> Font Size
        </label>

      <SettingItem
        label="Appearance"
        description="Choose your preferred theme"
        icon={<ComputerDesktopIcon className="w-5 h-5 text-purple-500" />}
      >
        <SettingSelect
          value={settings.theme || "system"}
          options={themes}
          onChange={val => updateSetting("theme", val as "light" | "dark" | "system")}
        />
      </SettingItem>

      {/* Font Size */}
      <SettingItem
        label="Font Size"
        description="Adjust text size for better readability"
        icon={<AdjustmentsHorizontalIcon className="w-5 h-5 text-amber-500" />}
      >
        <FontSizeDropdown
          value={settings.fontSize || "base"}
          onChange={val => updateSetting("fontSize", val)}
        />
      </SettingItem>
    </div>
  );
}

// Setting Item Container
function SettingItem({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center space-x-3 flex-1">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <div className="min-w-[180px]">
        {children}
      </div>
    </div>
  );
}

// Modern Select Component
function SettingSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: React.ReactNode }[];
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label 
        className="flex items-center font-semibold text-gray-700 dark:text-gray-200"
        style={{ 
          fontSize: "var(--body)",
          marginBottom: `calc(var(--body) * 0.25)`,
          gap: `calc(var(--body) * 0.5)`
        }}
      >
        {icon} {label}
      </label>
      <select
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 shadow focus:ring-2 focus:ring-blue-400 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ 
          fontSize: "var(--body)",
          padding: `calc(var(--body) * 0.75) calc(var(--body) * 1.0)`
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
    <select
      className="
        w-full rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
        py-2.5 px-3 text-sm
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-colors duration-200
        appearance-none cursor-pointer
        hover:border-gray-400 dark:hover:border-gray-500
      "
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
