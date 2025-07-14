"use client";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useUserSettings } from "@/components/UserSettingsContext";
import { FONT_SIZE_PRESETS_MAP } from "@/components/settings/font/FontSizeDropdown";

const ONBOARDING_STEPS = [
  {
    key: "verify_schema",
    label: "Map & Verify Your Data",
    description: "Confirm your data structure and column headers.",
    action: (
      <Link href="/onboarding" className="onboarding-action-link">
        Review
      </Link>
    ),
  },
  {
    key: "upload_data",
    label: "Upload Initial Data",
    description: "Import your first file to get started.",
    action: (
      <Link href="/uploads" className="onboarding-action-link">
        Upload
      </Link>
    ),
  },
  {
    key: "dashboard",
    label: "Set Up Your First Dashboard",
    description: "Create your first analytics dashboard chart.",
    action: (
      <Link href="/analytics" className="onboarding-action-link">
        Create
      </Link>
    ),
  },
  {
    key: "alerts",
    label: "Configure Alerts & Preferences",
    description: "Set up notifications and customize settings.",
    action: (
      <Link href="/settings/alerts" className="onboarding-action-link">
        Configure
      </Link>
    ),
  },
  {
    key: "add_users",
    label: "Add Your First Users",
    description: "Invite teammates to collaborate.",
    action: (
      <Link href="/onboarding/add-users" className="onboarding-action-link">
        Start
      </Link>
    ),
  },
];

// Custom styles for the action link
const actionLinkClass =
  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-200 transition shadow";

export default function SetupProgressPanel({
  completedKeys = [],
}: {
  completedKeys?: string[];
}) {
  const { settings } = useUserSettings();
  const px =
    FONT_SIZE_PRESETS_MAP[settings.fontSize] ||
    FONT_SIZE_PRESETS_MAP.base;

  const nextStep = ONBOARDING_STEPS.find((step) => !completedKeys.includes(step.key));

  return (
    <div
      className="w-full rounded-2xl p-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-gray-950 dark:to-indigo-900 shadow-lg border border-gray-200 dark:border-gray-800 transition-all"
      style={{ fontSize: `var(--body, ${px}px)` }} // fallback for SSR or if var is missing
    >
      <ol className="space-y-4 mb-2">
        {ONBOARDING_STEPS.map((step) => {
          const isDone = completedKeys.includes(step.key);
          const isCurrent = nextStep?.key === step.key;

          return (
            <li
              key={step.key}
              className={`flex items-start gap-3 group rounded-xl px-2 py-1 transition-all
                ${
                  isDone
                    ? "opacity-60"
                    : isCurrent
                    ? "bg-blue-100/60 dark:bg-blue-900/40 border-l-4 border-blue-400 dark:border-blue-700 shadow"
                    : "hover:bg-blue-50 dark:hover:bg-blue-950"
                }`}
            >
              <span className="mt-0.5 transition-transform">
                {isDone ? (
                  <CheckCircle2 className="text-green-500 animate-bounce" size={22} />
                ) : isCurrent ? (
                  <ArrowRight className="text-blue-500 animate-pulse" size={22} />
                ) : (
                  <Circle className="text-gray-400 group-hover:text-blue-400" size={22} />
                )}
              </span>
              <div>
                <div className="flex items-center gap-1 font-semibold text-base">
                  {step.label}
                  {isDone && (
                    <span className="ml-1 text-green-500 text-xs font-bold">
                      Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-300 animate-pulse font-bold">
                      Next
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {step.description}
                </div>
                {!isDone && (
                  <div className="mt-1">
                    {isCurrent ? (
                      <span className={actionLinkClass}>
                        {step.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    ) : (
                      step.action
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {/* Next step nudge */}
      {nextStep && (
        <div className="mt-6 flex flex-col items-center">
          <span className="text-xs text-blue-500 font-semibold mb-1 animate-pulse">
            Continue your onboarding!
          </span>
          <div className="font-medium mb-2 text-center text-blue-700 dark:text-blue-300">
            {nextStep.label}
          </div>
          <span className={actionLinkClass}>{nextStep.action}</span>
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