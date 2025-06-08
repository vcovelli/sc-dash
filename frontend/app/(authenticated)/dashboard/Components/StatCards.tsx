import GlassCard from "./GlassCard";

export default function StatCards({ fileCount, storageUsed, uptime }: {
  fileCount: number | null;
  storageUsed: string | null;
  uptime: string | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <GlassCard>
        <p className="text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>Total Files Uploaded</p>
        <h2 className="font-extrabold text-blue-600 dark:text-blue-400" style={{ fontSize: "var(--h2)" }}>
          {fileCount ?? "..."}
        </h2>
      </GlassCard>
      <GlassCard>
        <p className="text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>Storage Used</p>
        <h2 className="font-extrabold text-green-600 dark:text-green-400" style={{ fontSize: "var(--h2)" }}>
          {storageUsed ?? "..."}
        </h2>
      </GlassCard>
      <GlassCard>
        <p className="text-gray-500 dark:text-gray-300 mb-1" style={{ fontSize: "var(--small)" }}>System Uptime</p>
        <h2 className="font-extrabold text-purple-600 dark:text-purple-400" style={{ fontSize: "var(--h2)" }}>
          {uptime ?? "..."}
        </h2>
      </GlassCard>
    </div>
  );
}
