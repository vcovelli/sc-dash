"use client";

import SchemaMapperUploader from "@/components/SchemaMapperUploader";

export default function ManualMapPage() {
  return (
    <section className="
      min-h-screen w-full
      bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950
      flex items-center justify-center
      px-2 sm:px-6 py-10 sm:py-16
      transition-colors duration-300
    ">
      <div className="
        w-full max-w-2xl mx-auto
        flex flex-col gap-8
      ">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-1">
            <span className="text-4xl sm:text-5xl align-middle">🗂️</span>
            Map Your Existing Data
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Upload your CSV file and align your data columns with our system schema.<br className="hidden sm:block"/>
            Seamless data onboarding starts here.
          </p>
        </div>

        {/* Card */}
        <div className="
          bg-white/80 dark:bg-gray-900/80
          border border-white/20 dark:border-gray-900/30
          backdrop-blur-xl
          shadow-xl hover:shadow-2xl transition
          rounded-2xl px-4 sm:px-8 py-8 sm:py-10
          w-full
        ">
          <SchemaMapperUploader />
        </div>

        <div className="pt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
