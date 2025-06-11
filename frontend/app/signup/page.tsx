"use client";

import axios from "axios";
import type { AxiosError } from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { HiOutlineCube } from "react-icons/hi";
import zxcvbn from "zxcvbn";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwScore, setPwScore] = useState(0);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setShowConfirm(value.length > 0);
      setPwScore(zxcvbn(value).score);
    }
  };

  // Password strength text/colors
  const pwStrength = [
    { label: "Too Short", color: "text-red-500" },
    { label: "Weak", color: "text-red-400" },
    { label: "Medium", color: "text-yellow-500" },
    { label: "Good", color: "text-blue-600" },
    { label: "Strong", color: "text-green-600" },
  ];

  // Real-time password match
  const passwordsMatch =
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!passwordsMatch) {
      setMessage("❌ Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup/`, {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setMessage("✅ Account created! Check your email for verification.");
      // Call email verification endpoint (pseudo-code, implement as needed)
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/send-verification-email/`, {
        email: form.email,
      });
      // Optionally redirect after a few seconds
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setMessage(error.response?.data?.error || "❌ Signup failed.");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-blue-950 transition-colors">
      <div className="flex flex-col items-center w-full">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-xl px-8 pt-8 pb-10 mb-4 w-full max-w-sm border border-gray-100 dark:border-gray-800"
        >
          {/* Supply chain icon with company name */}
          <div className="flex flex-col items-center mb-6">
            <span className="inline-flex items-center gap-2 text-blue-700 dark:text-blue-300 text-3xl font-bold">
              <HiOutlineCube className="text-4xl" />
              SupplyWise
            </span>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
              Smarter supply chain SaaS
            </p>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>

          {/* Username */}
          <div className="mb-4 relative">
            <FaUser className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="new-username"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {/* Email */}
          <div className="mb-4 relative">
            <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {/* Password */}
          <div className="mb-2 relative">
            <FaLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {/* Strength Indicator */}
            {form.password.length > 0 && (
              <div className="flex items-center mt-2">
                <div className={`text-xs font-semibold ${pwStrength[pwScore].color}`}>
                  {pwStrength[pwScore].label}
                </div>
                <div className="ml-2 flex space-x-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-5 h-1 rounded ${
                        pwScore > idx
                          ? "bg-green-400"
                          : idx === 0 && pwScore === 0
                          ? "bg-red-300"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          {showConfirm && (
            <div className="mb-4 relative animate-fade-in">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {form.confirmPassword && (
                <div className="flex items-center mt-1 text-xs">
                  {passwordsMatch ? (
                    <span className="text-green-600 flex items-center">
                      <FaCheckCircle className="mr-1" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <FaTimesCircle className="mr-1" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition duration-150"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {/* Message */}
          {message && (
            <p
              className={`mt-4 text-center text-sm font-medium ${
                message.includes("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Log in here
            </a>.
          </p>
        </form>

        {/* THEME TOGGLE */}
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
