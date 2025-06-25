"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { FaUser, FaLock, FaGithub, FaApple, FaGoogle } from "react-icons/fa";
import { ThemeToggle } from "@/components/ThemeToggle";
import Script from "next/script";

declare global {
  interface Window {
    onGoogleSignIn: (response: any) => void;
  }
}

const SOCIALS = [
  {
    name: "GitHub",
    provider: "github",
    color: "border-gray-400",
    Icon: FaGithub,
    href: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/github/login/?intent=login`,
  },
];

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const router = useRouter();

  // If redirected back from GitHub, handle tokens & profile fetch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    if (access && refresh) {
      setLoading(true);
      setLoadingStep("Finishing authentication…");
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      window.history.replaceState(null, "", "/login");
      axios
        .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        })
        .then((res) => {
          const businessName = res.data?.business_name;
          localStorage.setItem(
            "client_name",
            businessName?.toLowerCase() || ""
          );
          setLoadingStep("All set! Redirecting…");
          setTimeout(() => {
            router.push(businessName ? "/dashboard" : "/welcome");
          }, 900);
        })
        .catch(() => {
          setLoadingStep("Redirecting…");
          router.push("/dashboard");
        })
    }
  }, [router]);

  // Google login
  const handleGoogleLogin = async () => {
    setMessage("");
    setLoading(true);
    setLoadingStep("Connecting to Google…");
    // @ts-ignore
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setLoading(false);
      setLoadingStep(null);
      setMessage("❌ Google not loaded.");
      return;
    }
    // @ts-ignore
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setLoading(false);
        setLoadingStep(null);
        setMessage("❌ Google login was cancelled or blocked.");
      }
    });
  };

  // Listen for Google credential
  useEffect(() => {
    window.onGoogleSignIn = async (response) => {
      setLoading(true);
      setLoadingStep("Verifying credentials…");
      if (!response.credential) {
        setLoading(false);
        setLoadingStep(null);
        setMessage("❌ Google login failed (no credential).");
        return;
      }
      try {
        setLoadingStep("Logging you in…");
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/`,
          { token: response.credential, intent: "login" }
        );
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem(
          "client_name",
          (data.user?.business_name || "").toLowerCase()
        );
        setLoadingStep("All set! Redirecting…");
        setTimeout(() => {
          router.push(data.new ? "/welcome" : "/dashboard");
        }, 900);
      } catch (err) {
        setLoadingStep(null);
        setMessage("❌ Google login failed (backend error)");
        setLoading(false);
      }
    };
  }, [router]);

  // Username/password login
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setLoadingStep("Verifying credentials…");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login/`,
        form
      );
      const { access, refresh } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      const profileRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me/`,
        {
          headers: { Authorization: `Bearer ${access}` },
        }
      );
      const businessName = profileRes.data?.business_name;
      localStorage.setItem(
        "client_name",
        businessName?.toLowerCase() || ""
      );
      setLoadingStep("All set! Redirecting…");
      setTimeout(() => {
        router.push(businessName ? "/dashboard" : "/welcome");
      }, 900);
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setMessage(error.response?.data?.error || "❌ Login failed.");
      setLoadingStep(null);
      setLoading(false);
    }
  };

  const handleSocialLogin = (href: string) => {
    setLoading(true);
    setLoadingStep("Connecting to provider…");
    window.location.href = href;
  };

  // Only show the login form *if* not loading
  return (
    <>
      {/* Google Identity Services script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => window.onGoogleSignIn(response),
          });
          setGoogleReady(true);
        }}
      />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md p-2">
          <div className="rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm px-8 py-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100 text-center tracking-tight">
              Welcome Back
            </h1>
            {/* Social Logins */}
            <div className="w-full flex flex-col gap-3 mb-6">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex items-center gap-3 justify-center py-3 px-4 border border-gray-400 rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition font-medium dark:text-white text-base"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700">
                  <FaGoogle className="text-xl" />
                </span>
                <span className="flex-1 text-center">Log in with Google</span>
              </button>
              {SOCIALS.map(({ name, Icon, color, href }) => (
                <button
                  key={name}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSocialLogin(href)}
                  className={`flex items-center gap-3 justify-center py-3 px-4 border ${color} rounded-xl bg-white dark:bg-gray-800 hover:shadow-md transition font-medium dark:text-white text-base`}
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700">
                    <Icon className="text-xl" />
                  </span>
                  <span className="flex-1 text-center">
                    Log in with {name}
                  </span>
                </button>
              ))}
            </div>
            {/* Divider */}
            <div className="w-full flex items-center gap-2 mb-6">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            {/* Username/Password */}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="mb-4 relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition duration-150 mb-2"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
              {message && (
                <p
                  className={`mt-2 text-center text-sm font-medium ${
                    message.includes("✅")
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {message}
                </p>
              )}
              <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-300">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Sign up here
                </a>
                .
              </p>
            </form>
          </div>
          {/* Footer */}
          <div className="flex flex-col items-center mt-6">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                SupplyWise
              </span>{" "}
              | Advanced BI Platform
            </div>
            <ThemeToggle />
          </div>
        </div>
        {/* Loading Modal/Overlay — always highest z-index */}
        {loading && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center gap-3 min-w-[260px]">
              <span className="loader mb-2" />
              <span className="text-base font-medium text-gray-800 dark:text-gray-100">
                {loadingStep || "Loading…"}
              </span>
            </div>
          </div>
        )}
      </main>
      <style jsx>{`
        .loader {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </>
  );
}
