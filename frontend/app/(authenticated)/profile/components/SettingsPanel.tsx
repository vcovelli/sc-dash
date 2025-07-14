import React from "react";
import { FaClock, FaDollarSign, FaAdjust, FaFont } from "react-icons/fa";
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
  { value: "light", label: <>🌞 Light</> },
  { value: "dark", label: <>🌙 Dark</> },
  { value: "system", label: <>🖥️ System</> },
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {/* Timezone */}
      <SettingSelect
        label="Timezone"
        icon={<FaClock className="text-blue-500" />}
        value={settings.timezone || "America/New_York"}
        options={timezones}
        onChange={val => updateSetting("timezone", val)}
      />
      {/* Currency */}
      <SettingSelect
        label="Default Currency"
        icon={<FaDollarSign className="text-green-500" />}
        value={settings.currencyCode || "USD"}
        options={currencies}
        onChange={val => updateSetting("currencyCode", val)}
      />
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
        <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-1">
          <span className="text-yellow-500"><FaFont /></span> Font Size
        </label>
        <FontSizeDropdown
          value={settings.fontSize || "base"}
          onChange={val => updateSetting("fontSize", val)}
        />
      </div>
    </div>
  );
}

// Helper for selects (keep this here or in a utilities file)
function SettingSelect({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: React.ReactNode }[];
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 mb-1">
        {icon} {label}
      </label>
      <select
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 py-3 px-4 text-base shadow focus:ring-2 focus:ring-blue-400 transition"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
