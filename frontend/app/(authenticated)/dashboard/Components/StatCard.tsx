// StatCard.tsx
import GlassCard from "./GlassCard";

type StatCardProps = {
  label: string;
  value: string | number | null;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple";
};

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900",
      text: "text-blue-700 dark:text-blue-300"
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900",
      text: "text-green-700 dark:text-green-300"
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900",
      text: "text-purple-700 dark:text-purple-300"
    }
  };

  const chosenColor = colorMap[color] || colorMap["blue"];

  return (
    <GlassCard className="flex items-center gap-4 p-5 h-full">
      {/* Icon with colored background */}
      <div className={`${chosenColor.bg} p-3 rounded-xl`}>
        {icon}
      </div>
      <div>
        {/* Label - small text, uses --small */}
        <p
          className="text-gray-500 dark:text-gray-300 mb-1"
          style={{ fontSize: "var(--small, 0.95rem)", lineHeight: 1.3 }}
        >
          {label}
        </p>
        {/* Value - big, bold, uses --h1 */}
        <h2
          className={`font-extrabold ${chosenColor.text}`}
          style={{
            fontSize: "var(--h1, 1.5rem)",
            lineHeight: 1.1
          }}
        >
          {value ?? "..."}
        </h2>
      </div>
    </GlassCard>
  );
}
