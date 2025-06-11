"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import FontSizeVarsProvider from "@/components/FontSizeVarsProvider";

// Plan definitions
const PLANS = [
  {
    name: "Free",
    price: "$0/mo",
    description: "Great for exploring the platform.",
    features: ["50 uploads/mo", "1 user", "Basic dashboards"],
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "Powerful tools for growing teams.",
    features: ["1,000 uploads/mo", "Advanced dashboards", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored for large teams and businesses.",
    features: [
      "Unlimited uploads",
      "Team management",
      "Dedicated account manager",
      "Advanced roles: Owner, Manager, Employee",
    ],
    isEnterprise: true,
  },
];

export default function PlansPage() {
  const [currentPlan, setCurrentPlan] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetPlan, setTargetPlan] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      .then((res) => setCurrentPlan(res.data.plan))
      .catch(() => console.error("Error loading plan"));
  }, []);

  const confirmDowngrade = (plan: string) => {
    setTargetPlan(plan);
    setShowConfirm(true);
  };

  const handlePlanChange = async () => {
    setShowConfirm(false);

    if (targetPlan === "Enterprise") {
      router.push("/onboarding/request-assist");
      return;
    }
    if (targetPlan === "Pro") {
      alert("Redirecting to Stripe Checkout...");
      // TODO: Implement Stripe redirect
      return;
    }
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/`,
        { plan: targetPlan },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      setCurrentPlan(targetPlan);
      router.push("/profile");
    } catch {
      alert("Error updating plan.");
    }
  };

  const handlePlanInfo = (planName: string) => {
    if (planName === "Enterprise") {
      setTargetPlan(planName);
      setShowPlanModal(true);
    } else if (planName === "Pro") {
      router.push("/profile/plans/pro");
    }
  };

  return (
    <FontSizeVarsProvider>
      <div
        className="flex flex-col items-center min-h-[90vh] py-14 bg-transparent"
        style={{ fontSize: "var(--body)" }}
      >
        <div className="w-full max-w-4xl mx-auto">
          <h1
            className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100 drop-shadow"
            style={{ fontSize: "var(--h1)" }}
          >
            Choose the Right Plan
          </h1>
          <div className="flex flex-col md:flex-row gap-10 justify-center items-stretch">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.name;
              const isPro = plan.name === "Pro";
              const isEnterprise = !!plan.isEnterprise;
              return (
                <div
                  key={plan.name}
                  className={`
                    flex-1 px-8 py-10 rounded-3xl shadow-2xl relative flex flex-col transition-all duration-300
                    ${isPro
                      ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white scale-105 ring-2 ring-blue-400"
                      : isEnterprise
                        ? "bg-[#181d22]/90 dark:bg-[#181d22]/90 text-yellow-200 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-400"
                        : "bg-white/90 dark:bg-[#202837]/90 text-gray-900 dark:text-gray-100"
                    }
                    ${isEnterprise ? "hover:shadow-[0_4px_60px_0_rgba(255,215,0,0.17)]" : ""}
                    hover:-translate-y-2 hover:shadow-2xl
                  `}
                  style={{
                    minWidth: 270,
                    boxShadow: isEnterprise
                      ? "0 0 40px 0 rgba(255,215,0,0.13)"
                      : undefined,
                    zIndex: isPro ? 10 : isEnterprise ? 9 : 1,
                    fontSize: "var(--body)",
                  }}
                >
                  {/* Enterprise Glow */}
                  {isEnterprise && (
                    <span className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-yellow-300 dark:ring-yellow-400 opacity-20"></span>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold" style={{ fontSize: "var(--h2)" }}>{plan.name}</h2>
                    {!isCurrent && (
                      <button
                        onClick={() => handlePlanInfo(plan.name)}
                        className={`text-xs underline ${
                          isPro
                            ? "text-blue-100 hover:text-blue-50"
                            : isEnterprise
                            ? "text-yellow-200 dark:text-yellow-400"
                            : "text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
                        }`}
                        style={{ fontSize: "var(--small)" }}
                      >
                        Learn more
                      </button>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold mb-2" style={{ fontSize: "var(--h1)" }}>{plan.price}</p>
                  <p className="text-sm opacity-90 mb-6" style={{ fontSize: "var(--body)" }}>{plan.description}</p>
                  <ul className="text-sm mb-8 space-y-2" style={{ fontSize: "var(--body)" }}>
                    {plan.features.map((feature, i) => (
                      <li key={i}>✓ {feature}</li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {isCurrent ? (
                      <div className="text-center text-base font-medium opacity-70 mt-4" style={{ fontSize: "var(--body)" }}>
                        You&apos;re on this plan
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          plan.name === "Free"
                            ? confirmDowngrade(plan.name)
                            : handlePlanChangeWrapper(plan.name)
                        }
                        className={`
                          w-full py-3 rounded-full font-semibold shadow transition-all duration-300
                          ${isEnterprise
                            ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                            : isPro
                            ? "bg-white text-blue-700 hover:bg-gray-100"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                          }
                        `}
                        style={{
                          fontWeight: 700,
                          letterSpacing: ".01em",
                          fontSize: "var(--body)",
                        }}
                      >
                        {plan.name === "Enterprise" ? "Contact Sales" : `Switch to ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
            onClick={() => setShowConfirm(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md text-center shadow-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: "var(--body)" }}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--h2)" }}
              >
                Are you sure you want to switch to {targetPlan}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6" style={{ fontSize: "var(--small)" }}>
                You may lose access to features included in your current plan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium"
                  style={{ fontSize: "var(--body)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlanChange}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  style={{ fontSize: "var(--body)" }}
                >
                  Confirm Downgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Plan Info Modal */}
        {showPlanModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
            onClick={() => setShowPlanModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-8 shadow-xl relative text-gray-800 dark:text-gray-100"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: "var(--body)" }}
            >
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white text-lg"
                onClick={() => setShowPlanModal(false)}
                style={{ fontSize: "var(--h2)" }}
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-4" style={{ fontSize: "var(--h2)" }}>Why Enterprise?</h2>
              <p className="mb-4" style={{ fontSize: "var(--body)" }}>
                The Enterprise plan is built for high-performing organizations that need power,
                flexibility, and support at scale.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ fontSize: "var(--body)" }}>
                <li>Unlimited uploads and API usage</li>
                <li>Advanced team management and permissions</li>
                <li>Dedicated success manager and custom onboarding</li>
                <li>Priority support and early feature access</li>
                <li>Contract and invoicing flexibility</li>
              </ul>
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    router.push("/onboarding/request-assist");
                  }}
                  className="inline-block bg-[#FFD700] text-black font-semibold px-6 py-2 rounded hover:bg-[#e6c200] dark:bg-yellow-400 dark:hover:bg-yellow-500 transition"
                  style={{ fontSize: "var(--body)" }}
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FontSizeVarsProvider>
  );
}

// For simple redirect (update as needed)
function handlePlanChangeWrapper(plan: string) {
  if (plan === "Enterprise") {
    window.location.href = "/onboarding/request-assist";
    return;
  }
  if (plan === "Pro") {
    alert("Redirecting to Stripe Checkout...");
    return;
  }
}
