"use client";

import SchemaMapperUploader from "@/components/SchemaMapperUploader";

export default function ManualMapPage() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            🗂️ Map Your Existing Data
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file and align your data columns with our system schema.
            Seamless data onboarding starts here.
          </p>
        </div>

        <div className="bg-white p-10 md:p-12 rounded-3xl border border-gray-200 shadow-xl transition-all duration-300 hover:shadow-2xl">
          <SchemaMapperUploader />
        </div>

        <div className="pt-10 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
