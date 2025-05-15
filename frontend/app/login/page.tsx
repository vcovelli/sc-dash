// app/login/page.tsx
"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post("http://192.168.1.42:8000/auth/login/", form);
      const { access, refresh } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setMessage("✅ Logged in!");
      router.push("/dashboard");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "❌ Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-xl px-8 pt-6 pb-8 mb-4 w-full max-w-sm border border-gray-100"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Log In</h1>

        <div className="mb-4 relative">
          <FaUser className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="mb-4 relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition duration-150"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${
            message.includes("✅") ? "text-green-600" : "text-red-500"
          }`}>
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline font-medium">Sign up here</a>.
        </p>
      </form>
    </main>
  );
}
