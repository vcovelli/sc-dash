import GlassCard from "./GlassCard";
import Link from "next/link";
import { Compass, LifeBuoy } from "lucide-react";

export default function InsightsFeedbackHelp() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Product Tour */}
      <GlassCard className="flex items-center gap-4 p-5">
        <Compass className="w-7 h-7 text-blue-500" />
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Take a Product Tour</div>
          <Link href="/tour" className="underline text-blue-600 dark:text-blue-300 text-sm hover:text-blue-800">
            Start Tour
          </Link>
        </div>
      </GlassCard>

      {/* Need Help */}
      <GlassCard className="flex items-center gap-4 p-5">
        <LifeBuoy className="w-7 h-7 text-blue-500" />
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Need Help?</div>
          <div className="flex flex-col gap-1 text-sm">
            <Link href="/docs" className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800">
              Getting Started Guide
            </Link>
            <Link href="/support" className="underline text-blue-600 dark:text-blue-300 hover:text-blue-800">
              Contact Support
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
