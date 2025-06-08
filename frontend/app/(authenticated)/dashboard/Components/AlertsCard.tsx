import GlassCard from "./GlassCard";
import Link from "next/link";

export default function AlertsCard({ alerts }: { alerts: any[] }) {
  return (
    <div>
      {alerts.length > 0 ? (
        <GlassCard className="bg-yellow-100/80 dark:bg-yellow-900/80 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-100 flex items-center gap-2">
          {alerts.map((a, idx) => (
            <span key={idx} className="flex items-center" style={{ fontSize: "var(--body)" }}>
              <b className="mr-2">{a.type === "error" ? "⚠️" : "ℹ️"}</b>
              {a.msg}
              {a.action && (
                <Link href={a.action.href} className="ml-2 underline text-blue-700 dark:text-blue-300">
                  {a.action.label}
                </Link>
              )}
            </span>
          ))}
        </GlassCard>
      ) : (
        <GlassCard className="bg-green-50/80 dark:bg-green-950/70 border-l-4 border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 flex items-center gap-2">
          <span style={{ fontSize: "var(--body)" }}>✅ No issues detected</span>
        </GlassCard>
      )}
    </div>
  );
}
