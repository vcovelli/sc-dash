"use client";

import axios, { AxiosError } from "axios";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaTimesCircle, FaGithub, FaGoogle } from "react-icons/fa";
import Script from "next/script";
import zxcvbn from "zxcvbn";
import { HiOutlineCube } from "react-icons/hi";
import { ThemeToggle } from "@/components/settings/theme/ThemeToggle";

interface SignupErrorResponse {
  non_field_errors?: string[];
  email?: string[];
  username?: string[];
  password1?: string[];
  [key: string]: unknown;
}

interface GoogleCredentialResponse {
  credential?: string;
  [key: string]: unknown;
}

type PromptMomentNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          prompt: (callback: (notification: PromptMomentNotification) => void) => void;
        };
      };
    };
  }
}

const SOCIALS = [
  {
    name: "Google",
    provider: "google",
    color: "border-gray-400",
    Icon: FaGoogle,
    onClick: "google",
  },
  {
    name: "GitHub",
    provider: "github",
    color: "border-gray-400",
    Icon: FaGithub,
    href: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/login/?intent=signup`,
  },
];

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

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
  const [googleReady, setGoogleReady] = useState(false);

  const handleCustomGoogleLogin = () => {
    setMessage("");
    setLoading(true);
    setTimeout(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
            setMessage("❌ Google signup was cancelled or blocked.");
          }
        });
      } else {
        setLoading(false);
        setMessage("❌ Google API is not ready.");
      }
    }, 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setShowConfirm(value.length > 0);
      setPwScore(zxcvbn(value).score);
    }
  };

  const passwordsMatch =
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    form.password === form.confirmPassword;

  const pwStrength = [
    { label: "Too Short", color: "text-red-500" },
    { label: "Weak", color: "text-red-400" },
    { label: "Medium", color: "text-yellow-500" },
    { label: "Good", color: "text-blue-600" },
    { label: "Strong", color: "text-green-600" },
  ];

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
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
        password1: form.password,
        password2: form.confirmPassword,
      });
      setMessage("✅ Account created! Check your email to verify your account.");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const error = err as AxiosError<SignupErrorResponse>;
      setMessage(
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        error.response?.data?.password1?.[0] ||
        "❌ Signup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse: GoogleCredentialResponse) => {
    setMessage("");
    setLoading(true);

    if (!credentialResponse.credential) {
      setMessage("❌ Google signup failed (no credential).");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/`,
        {
          token: credentialResponse.credential,
          intent: "signup",
        }
      );

      if (!data.access || !data.refresh) {
        setMessage("❌ Google signup failed (no tokens received).");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("client_name", (data.user?.business_name || "").toLowerCase());

      setMessage("✅ Google signup success!");

      if (data.new) {
        router.push("/welcome");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setMessage("❌ Google signup failed.");
      if (axios.isAxiosError(err) && err.response) {
        setMessage(
          `❌ Google signup failed: ${
            err.response.data?.detail ||
            err.response.data?.error ||
            "backend error"
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    function handleGoogleCredentialResponse(response: GoogleCredentialResponse) {
      handleGoogleSuccess({ credential: response.credential });
    }
    if (typeof window !== "undefined" && window.google && GOOGLE_CLIENT_ID) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });
      setGoogleReady(true);
    }
  }, [handleGoogleSuccess]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-900 dark:to-blue-950 transition-colors">
        <div className="flex flex-col items-center w-full">
          <form
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-gray-900 shadow-2xl rounded-xl px-8 pt-8 pb-10 mb-4 w-full max-w-sm border border-gray-100 dark:border-gray-800"
          >
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

            {/* Social logins */}
            <div className="flex flex-col gap-2 mb-4">
              {SOCIALS.map(({ name, Icon, color, href, onClick }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading || (onClick === "google" && !googleReady)}
                  onClick={() => {
                    if (onClick === "google") {
                      handleCustomGoogleLogin();
                    } else {
                      if (href) {
                        window.location.href = href;
                      }
                    }
                  }}
                  className={`flex items-center gap-3 justify-center py-3 px-4 border ${color} rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition font-medium dark:text-white text-base`}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700">
                    <Icon className="text-xl" />
                  </span>
                  <span className="flex-1 text-center">Sign up with {name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
            </div>

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
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
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
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
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
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
              />
              {form.password.length > 0 && (
                <div className="flex items-center mt-2">
                  <div className={`text-xs font-semibold ${pwStrength[pwScore].color}`}>{pwStrength[pwScore].label}</div>
                  <div className="ml-2 flex space-x-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-5 h-1 rounded ${pwScore > idx
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
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition duration-150"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            {/* Messages */}
            {message && (
              <p className={`mt-4 text-center text-sm font-medium transition-all duration-200 ${
                message.includes("✅") ? "text-green-600 animate-fade-in" : "text-red-500 animate-fade-in"
              }`}>
                {message}
              </p>
            )}

            {/* Log in link */}
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account? {" "}
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                Log in here
              </a>.
            </p>
          </form>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </div>
      </main>
      <style jsx>{`
        .animate-fade-in {
          animation: fade-in 0.4s;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(8px);}
          100% { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </>
  );
}
