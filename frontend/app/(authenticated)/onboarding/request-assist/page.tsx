"use client";

import { useState } from "react";
import { PaperClipIcon } from "@heroicons/react/20/solid";

export default function RequestAssistPage() {
  const [fileName, setFileName] = useState("");

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16 bg-white dark:bg-[#131823] rounded-3xl transition-colors">
      <div className="w-full max-w-2xl">
        {/* Header - sits outside the card */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
            Need Assistance?
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Upload your file and leave us a note. Our onboarding experts will handle the rest.
          </p>
        </div>

        {/* Card */}
        <form
          className="
            bg-white dark:bg-[#181c23]
            border border-gray-200 dark:border-[#232738]
            rounded-2xl shadow-xl
            p-8 space-y-8
            transition
          "
        >
          <div className="space-y-3">
            <label className="block text-base font-semibold text-gray-700 dark:text-gray-200">
              Upload File
            </label>
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm 
                bg-white dark:bg-[#232738]
                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                file:text-sm file:font-semibold 
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 
                dark:file:bg-[#21262d] dark:file:text-blue-300 hover:dark:file:bg-[#30363d] 
                transition-all"
            />
            {fileName && (
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                <PaperClipIcon className="h-4 w-4" />
                {fileName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
              Add a Note <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Anything we should know?"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm resize-none min-h-[120px] shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:outline-none bg-white dark:bg-[#232738] text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            className="
              w-full text-lg font-bold bg-blue-600 hover:bg-blue-700 
              text-white py-4 rounded-lg shadow-md hover:shadow-blue-700/30
              transition-all duration-300 tracking-wide
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            🎯 Submit to Onboarding Team
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-8">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
