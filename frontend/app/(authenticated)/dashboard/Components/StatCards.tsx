import { LucideUploadCloud, LucideDatabase, LucideActivity } from "lucide-react";
import StatCard from "./StatCard";

export default function StatCards({
  fileCount,
  storageUsed,
  uptime,
}: {
  fileCount: number | null;
  storageUsed: string | null;
  uptime: string | null;
}) {
  const stats = [
    {
      label: "Total Files Uploaded",
      value: fileCount,
      icon: <LucideUploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-300" />,
      color: "blue" as const,
    },
    {
      label: "Storage Used",
      value: storageUsed,
      icon: <LucideDatabase className="w-8 h-8 text-green-600 dark:text-green-300" />,
      color: "green" as const,
    },
    {
      label: "System Uptime",
      value: uptime,
      icon: <LucideActivity className="w-8 h-8 text-purple-600 dark:text-purple-300" />,
      color: "purple" as const,
    },
  ];

  return (
    <>
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </>
  );
}
