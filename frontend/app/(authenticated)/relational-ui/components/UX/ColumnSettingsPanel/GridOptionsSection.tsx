"use client";
import React from "react";

interface Props {
  zebraStriping: boolean;
  setZebraStriping: (val: boolean) => void;
}

const GridOptionsSection: React.FC<Props> = ({ zebraStriping, setZebraStriping }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-300 mb-2 text-center">
      Grid Options
    </label>
    <div className="flex justify-center">
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
    </div>
  </div>
);

export default GridOptionsSection;
