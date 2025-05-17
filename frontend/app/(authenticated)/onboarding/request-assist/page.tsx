"use client";

import { useState } from "react";
import { PaperClipIcon } from "@heroicons/react/20/solid";

export default function RequestAssistPage() {
  const [fileName, setFileName] = useState("");

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900">Need Assistance?</h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your file and leave us a note. Our onboarding experts will handle the rest.
          </p>
        </div>

        <form className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="block w-full border border-gray-300 rounded-lg px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileName && (
              <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <PaperClipIcon className="h-4 w-4" />
                {fileName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add a Note <span className="text-gray-400">(optional)</span></label>
            <textarea
              placeholder="Anything we should know?"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none min-h-[120px] shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            🎯 Submit to Onboarding Team
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 pt-8">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
