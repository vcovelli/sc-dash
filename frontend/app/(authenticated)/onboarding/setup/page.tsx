"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function FirstTimeSetupPage() {
  const router = useRouter();
  const [hasSchema, setHasSchema] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-schema/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const headers = res.data?.expected_headers || [];
        setHasSchema(headers.length > 0);
      })
      .catch(() => setHasSchema(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`,
        { business_name: businessName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push("/onboarding/start-fresh");
    } catch (err) {
      alert("Failed to save business name.");
    } finally {
      setLoading(false);
    }
  };

  if (hasSchema === null)
    return (
      <p className="text-center mt-12 text-gray-500 dark:text-gray-400">
        Checking your setup...
      </p>
    );
  if (hasSchema) {
    router.push("/dashboard");
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-[#202937] dark:to-[#13171c] transition-colors duration-500">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800 transition-all duration-300">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          👋 Welcome to SupplyWise
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Let’s get your business identity set up before we move forward.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Your Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 rounded-lg text-lg bg-white dark:bg-[#232c3b] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            {loading ? "Saving..." : "Continue to Setup"}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => router.push("/dashboard?demo=true")}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3 rounded-lg transition shadow"
          >
            👀 Take a Tour (View Demo)
          </button>
        </div>
      </div>
    </main>
  );
}
