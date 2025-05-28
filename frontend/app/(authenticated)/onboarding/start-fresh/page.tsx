"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const featureOptions = [
  { key: "orders", label: "📦 Track customer orders" },
  { key: "products", label: "🛍️ Manage product inventory and SKUs" },
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
        if (res.data?.business_name) {
          setBusinessName(res.data.business_name);
        }
      } catch (err: any) {
        if (err.response?.status === 401 && refreshToken) {
          try {
            const refreshRes = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            const newAccess = refreshRes.data.access;
            localStorage.setItem("access_token", newAccess);

            const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`, {
              headers: { Authorization: `Bearer ${newAccess}` },
            });

            if (profileRes.data?.business_name) {
              setBusinessName(profileRes.data.business_name);
            }
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

        // Open both tabs
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
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-6 py-16 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            🧾 Start Fresh
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Answer a few questions and we’ll build a smart data template for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-200 space-y-10">
          <div>
            <label htmlFor="business-name" className="block text-lg font-semibold mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              placeholder="e.g. canes"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">What would you like to track?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureOptions.map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(key)}
                    onChange={() => toggleFeature(key)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-gray-700 font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeSampleData}
                onChange={() => setIncludeSampleData(!includeSampleData)}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              Include sample data in template
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              🚀 Generate My Data Workbook
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-400 pt-8">
          &copy; {new Date().getFullYear()} SupplyWise Inc. All rights reserved.
        </div>
      </div>
    </section>
  );
}
