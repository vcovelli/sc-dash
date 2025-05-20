"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    name: "Free",
    price: "$0/mo",
    description: "Great for exploring the platform.",
    features: ["50 uploads/mo", "1 user", "Basic dashboards"],
    style: "bg-gray-100 text-gray-700 border border-gray-300",
    button: "bg-gray-400 hover:bg-gray-500 text-white",
    tag: "text-gray-500",
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "Powerful tools for growing teams.",
    features: ["1,000 uploads/mo", "Advanced dashboards", "Priority support"],
    style:
      "bg-gradient-to-br from-blue-600 to-blue-800 text-white border border-blue-500 shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out",
    button:
      "bg-white text-blue-700 hover:bg-gray-100 font-semibold transition-all duration-300",
    tag: "text-white",
    highlight: true,
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
    style:
      "relative overflow-hidden bg-black text-[#FFD700] border border-[#FFD700] shadow-[0_0_20px_rgba(218,165,32,0.6)] hover:shadow-[0_0_40px_#FFD700aa] transform hover:scale-[1.03] transition-all duration-300 ease-in-out group",
    button:
      "bg-[#FFD700] hover:bg-[#e6c200] text-black font-bold transition-all duration-300",
    tag: "text-[#FFD700]",
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
      .catch((err) => console.error("Error loading plan", err));
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
      // replace with Stripe redirect
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
    } catch (err) {
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Choose the Right Plan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          const isDowngrade = plan.name === "Free" && !isCurrent;

          return (
            <div
              key={plan.name}
              className={`rounded-xl p-6 flex flex-col justify-between min-h-[440px] animate-fade-in-up ${plan.style}`}
            >
              {plan.name === "Enterprise" && (
                <span className="absolute top-0 left-[-75%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-[-20deg] group-hover:animate-shine pointer-events-none" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`text-xl font-semibold ${plan.tag}`}>{plan.name}</h2>
                  {!isCurrent && (
                    <button
                      onClick={() => handlePlanInfo(plan.name)}
                      className="text-xs text-blue-400 hover:text-blue-200 underline"
                    >
                      Learn more
                    </button>
                  )}
                </div>

                <p className="text-2xl font-bold mb-1">{plan.price}</p>
                <p className="text-sm mb-4">{plan.description}</p>

                <ul className="text-sm mb-6 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-4">
                {isCurrent ? (
                  <p className="text-sm text-center font-medium opacity-80">
                    You're on this plan
                  </p>
                ) : (
                  <button
                    onClick={() =>
                      isDowngrade
                        ? confirmDowngrade(plan.name)
                        : handlePlanChangeWrapper(plan.name)
                    }
                    className={`w-full py-2 rounded-md ${plan.button}`}
                  >
                    {plan.isEnterprise ? "Contact Sales" : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md text-center shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Are you sure you want to switch to {targetPlan}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You may lose access to features included in your current plan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePlanChange}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
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
            className="bg-white rounded-lg max-w-2xl w-full p-8 shadow-xl relative text-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-black text-lg"
              onClick={() => setShowPlanModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4">Why Enterprise?</h2>
            <p className="mb-4">
              The Enterprise plan is built for high-performing organizations that need power,
              flexibility, and support at scale.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
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
                className="inline-block bg-[#FFD700] text-black font-semibold px-6 py-2 rounded hover:bg-[#e6c200] transition"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
