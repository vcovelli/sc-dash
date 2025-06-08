"use client";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    key: "add_users",
    label: "Add Your First Users",
    description: "Invite teammates to collaborate.",
    action: <Link href="/onboarding/add-users" className="text-blue-600 underline text-xs font-medium">Start</Link>,
  },
  {
    key: "upload_data",
    label: "Upload Initial Data",
    description: "Import your first orders, inventory, or products.",
    action: <Link href="/uploads" className="text-blue-600 underline text-xs font-medium">Upload</Link>,
  },
  {
    key: "verify_data",
    label: "Map & Verify Your Data",
    description: "Confirm your columns and data mappings.",
    action: <Link href="/data/verify" className="text-blue-600 underline text-xs font-medium">Review</Link>,
  },
  {
    key: "dashboard",
    label: "Set Up Your First Dashboard",
    description: "Create your first analytics dashboard.",
    action: <Link href="/analytics" className="text-blue-600 underline text-xs font-medium">Create</Link>,
  },
  {
    key: "alerts",
    label: "Configure Alerts & Preferences",
    description: "Set up notifications and customize settings.",
    action: <Link href="/settings/alerts" className="text-blue-600 underline text-xs font-medium">Configure</Link>,
  },
];

export default function SetupProgressPanel({
  completedKeys = [],
}: {
  completedKeys?: string[];
}) {
  const nextStep = ONBOARDING_STEPS.find((step) => !completedKeys.includes(step.key));

  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow rounded-xl p-4 border border-gray-200 dark:border-gray-800 transition-all">
      {/* Only show the checklist */}
      <ol className="space-y-4 mb-2">
        {ONBOARDING_STEPS.map((step) => {
          const isDone = completedKeys.includes(step.key);
          return (
            <li
              key={step.key}
              className={`flex items-start gap-3 group transition-all ${
                isDone ? "opacity-60" : ""
              }`}
            >
              <span
                className={`transition-transform ${
                  isDone ? "scale-110" : ""
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="text-green-500" size={22} />
                ) : (
                  <Circle className="text-gray-400 group-hover:text-blue-400" size={22} />
                )}
              </span>
              <div>
                <div className="flex items-center gap-1 font-semibold">
                  {step.label}
                  {isDone && (
                    <span className="ml-1 text-green-500 text-xs font-bold">Done</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{step.description}</div>
                {!isDone && <div className="mt-1">{step.action}</div>}
              </div>
            </li>
          );
        })}
      </ol>
      {/* Next step nudge */}
      {nextStep && (
        <div className="mt-6 flex flex-col items-center">
          <span className="text-xs text-blue-500 font-semibold mb-1 animate-pulse">
            Next step
          </span>
          <div className="font-medium mb-2 text-center text-blue-700 dark:text-blue-300">{nextStep.label}</div>
          {nextStep.action}
        </div>
      )}
      {/* Completion */}
      {!nextStep && (
        <div className="mt-6 flex flex-col items-center text-green-600 font-semibold text-lg">
          <CheckCircle2 size={28} className="mb-1" />
          All steps complete! You’re ready to go. 🚀
        </div>
      )}
    </div>
  );
}
