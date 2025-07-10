"use client";
import React from "react";
import { useUserSettings } from "@/components/UserSettingsContext";

interface Props {
  zebraStriping: boolean;
  setZebraStriping: (val: boolean) => void;
  showSystemColumns: boolean;
  setShowSystemColumns: (val: boolean) => void;
}

const GridOptionsSection: React.FC<Props> = (props) => {
  const { zebraStriping, setZebraStriping, showSystemColumns, setShowSystemColumns } = props;
  const { userRole } = useUserSettings();
  return (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-2 text-center">
      Grid Options
    </label>
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setZebraStriping(!zebraStriping)}
        className={`text-xs font-medium px-4 py-2 rounded-lg border shadow-sm transition-all duration-200
          ${
            zebraStriping
              ? "bg-[repeating-linear-gradient(135deg,#2563eb_0px,#2563eb_12px,#1d4ed8_12px,#1d4ed8_24px)] text-white border-blue-700"
              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
          }`}
      >
        {zebraStriping ? "Zebra Striping On" : "Zebra Striping Off"}
      </button>
      {userRole?.canViewSystemColumns && (
        <button
          onClick={() => setShowSystemColumns(!showSystemColumns)}
          className={`text-xs font-medium px-4 py-2 rounded-lg border shadow-sm transition-all duration-200
            ${
              showSystemColumns
                ? "bg-green-600 text-white border-green-700"
                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            }`}
        >
          {showSystemColumns ? "System Columns On" : "System Columns Off"}
        </button>
      )}
      </div>
    </div>
  );
};

export default GridOptionsSection;
