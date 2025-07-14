import Link from "next/link";

export default function BrandingBlock() {
  return (
    <div className="flex flex-col justify-center items-center h-full min-h-[250px] py-6 px-2 mt-10">
      <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 text-transparent bg-clip-text mb-1 tracking-tight text-center">
        SupplyWise
      </div>
      <div className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 font-semibold text-center">
        Your Trusted Partner for Modern Analytics & Insights
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-xl mt-1">
        Instantly unlock data-driven decisions, smart forecasting, and effortless supply chain collaboration.<br />
        Experience premium support, stunning dashboards, and enterprise reliability—
        <b>all in one place.</b>
      </div>
      <div className="mt-6 flex flex-row gap-4 justify-center">
        <Link href="/analytics">
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition">
            Explore Analytics
          </button>
        </Link>
        <Link href="/profile/plans/pro">
          <button className="px-4 py-2 rounded-xl border border-blue-700 text-blue-700 bg-white/80 dark:bg-white font-bold shadow hover:bg-blue-50 hover:scale-105 transition">
            Upgrade for More
          </button>
        </Link>
      </div>
    </div>
  );
}
