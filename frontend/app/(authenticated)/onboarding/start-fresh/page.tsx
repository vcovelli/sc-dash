"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const featureOptions = [
  { key: "orders", label: "📦 Track customer orders" },
  { key: "products", label: "🛍️ Manage product inventory / SKUs" },
  { key: "suppliers", label: "🏭 Track supplier data" },
  { key: "warehouses", label: "🏬 Track warehouse locations" },
  { key: "customers", label: "👥 Track customer information" },
  { key: "shipments", label: "🚚 Track shipping and delivery" },
];

export default function StartFreshPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [includeSampleData, setIncludeSampleData] = useState(true);

  useEffect(() => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data?.business_name) setBusinessName(res.data.business_name);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 401 &&
        refreshToken
      ) {
        try {
          const refreshRes = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          const newAccess = refreshRes.data.access;
          localStorage.setItem("access_token", newAccess);

          const profileRes = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`,
            { headers: { Authorization: `Bearer ${newAccess}` } }
          );
          if (profileRes.data?.business_name) setBusinessName(profileRes.data.business_name);
        } catch (refreshErr) {
          console.error("Token refresh failed", refreshErr);
        }
      } else {
        console.error("Failed to fetch profile:", err);
      }
    }
  };

  fetchProfile();
}, []);

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName) {
      alert("Please enter your business name.");
      return;
    }

    const token = localStorage.getItem("access_token");

    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`, {
        business_name: businessName,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/schema-wizard/generate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_name: businessName.toLowerCase(),
          features: selectedFeatures,
          include_sample_data: includeSampleData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const { download_url, grist_view_url } = data;

        if (grist_view_url) window.open(grist_view_url, "_blank");
        if (download_url) window.open(download_url, "_blank");

        localStorage.setItem("client_name", businessName.toLowerCase());
        router.push("/uploads");
      } else {
        const error = await res.json();
        alert(`Failed to generate schema: ${error.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error submitting schema:", err);
      alert("Unexpected error saving schema.");
    }
  };

  return (
    <section className="
      min-h-screen
      bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950
      flex items-center justify-center
      px-2 sm:px-6 py-8 sm:py-20
      transition-colors duration-500
    ">
      <div className="
        w-full max-w-2xl mx-auto
        rounded-3xl
        shadow-xl
        bg-white/80 dark:bg-gray-900/80
        border border-white/20 dark:border-gray-900/30
        backdrop-blur-xl
        px-4 sm:px-10 py-8 sm:py-12
        flex flex-col gap-8
      ">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
            <span className="align-middle text-4xl mr-2">🧾</span>Start Fresh
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium">
            Answer a few questions and we’ll build a smart data template for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Name */}
          <div>
            <label htmlFor="business-name" className="block text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              placeholder="e.g. canes"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="
                w-full border border-gray-300 dark:border-gray-700
                rounded-lg px-4 py-3 text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600
                bg-white/90 dark:bg-[#202532] text-gray-900 dark:text-gray-100
                shadow-sm
                transition
              "
              required
            />
          </div>

          {/* Features */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              What would you like to track?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {featureOptions.map(({ key, label }) => (
                <label
                  key={key}
                  className={`
                    flex items-center px-3 py-2 rounded-lg
                    cursor-pointer gap-3
                    bg-white/60 dark:bg-[#202532]/80 border border-gray-200 dark:border-gray-700
                    shadow-sm
                    transition
                    hover:bg-blue-50/70 dark:hover:bg-blue-900/30
                    ${selectedFeatures.includes(key) ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : ''}
                  `}
                  tabIndex={0}
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(key)}
                    onChange={() => toggleFeature(key)}
                    className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400 rounded transition"
                  />
                  <span className="text-gray-700 dark:text-gray-100 font-medium text-base">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sample Data */}
          <div className="flex items-center gap-3 text-base text-gray-700 dark:text-gray-200 font-medium">
            <input
              type="checkbox"
              checked={includeSampleData}
              onChange={() => setIncludeSampleData(!includeSampleData)}
              className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400 rounded"
            />
            Include sample data in template
          </div>

          {/* Button */}
          <button
            type="submit"
            className="
              w-full text-base sm:text-lg font-bold
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-700 hover:to-indigo-700
              text-white py-3 sm:py-4
              rounded-xl shadow-lg
              focus:outline-none focus:ring-2 focus:ring-blue-400
              transition-all duration-200
              active:scale-98
            "
          >
            🚀 Generate My Data Workbook
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-2">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
