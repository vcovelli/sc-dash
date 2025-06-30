"use client";

import { useState } from "react";
import { PaperClipIcon } from "@heroicons/react/20/solid";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";

export default function RequestAssistPage() {
  const [fileName, setFileName] = useState("");

  return (
    <FontSizeVarsProvider>
      <section
        className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4"
        style={{ fontSize: "var(--body)" }}
      >
        <div
          className="
            w-full max-w-lg
            glass-card
            p-10
            flex flex-col
            items-center
            shadow-xl
            rounded-2xl
            border border-white/20 dark:border-gray-900/30
            bg-white/80 dark:bg-gray-900/80
            backdrop-blur-xl
            mt-12 mb-8
          "
          style={{ fontSize: "inherit" }}
        >
          {/* Header */}
          <h1
            className="font-extrabold text-gray-900 dark:text-white mb-2 text-center"
            style={{ fontSize: "var(--h1)" }}
          >
            Need Assistance?
          </h1>
          <p
            className="text-gray-600 dark:text-gray-300 text-center mb-6"
            style={{ fontSize: "var(--body)" }}
          >
            Upload your file and leave us a note.<br />
            Our onboarding experts will handle the rest.
          </p>

          <form className="w-full space-y-6">
            {/* Upload */}
            <div>
              <label
                className="font-semibold text-gray-700 dark:text-gray-200 mb-1 block"
                style={{ fontSize: "var(--body)" }}
              >
                Upload File
              </label>
              <input
                type="file"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                className="
                  block w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm
                  bg-white dark:bg-[#232738]
                  file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                  dark:file:bg-[#21262d] dark:file:text-blue-300 hover:dark:file:bg-[#30363d]
                  transition-all
                "
                style={{ fontSize: "var(--body)" }}
              />
              {fileName && (
                <p className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-300"
                  style={{ fontSize: "var(--small)" }}
                >
                  <PaperClipIcon className="h-4 w-4" />
                  {fileName}
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label
                className="font-semibold text-gray-700 dark:text-gray-200 mb-1 block"
                style={{ fontSize: "var(--body)" }}
              >
                Add a Note{" "}
                <span className="text-gray-400" style={{ fontSize: "var(--small)" }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Anything we should know?"
                className="
                  w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm resize-none min-h-[110px]
                  shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:outline-none
                  bg-white dark:bg-[#232738] text-gray-900 dark:text-gray-100
                "
                style={{ fontSize: "var(--body)" }}
              />
            </div>

            <button
              type="submit"
              className="
                w-full font-bold bg-blue-600 hover:bg-blue-700
                text-white py-4 rounded-xl shadow-md hover:shadow-blue-700/30
                transition-all duration-300 tracking-wide
                focus:outline-none focus:ring-2 focus:ring-blue-400
                flex items-center justify-center gap-2
              "
              style={{ fontSize: "var(--h2)" }}
            >
              <span>🎯</span> Submit to Onboarding Team
            </button>
          </form>
        </div>
      </section>
    </FontSizeVarsProvider>
  );
}
