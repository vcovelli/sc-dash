import React from "react";
import { RefreshCw, Clock } from "lucide-react";

interface DataFreshnessIndicatorProps {
  lastUpdated?: Date | string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function DataFreshnessIndicator({
  lastUpdated,
  isLoading = false,
  onRefresh,
  className = "",
}: DataFreshnessIndicatorProps) {
  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIndicatorColor = () => {
    if (!lastUpdated) return "text-gray-400";
    
    const d = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 5) return "text-green-500";
    if (diffMinutes < 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <Clock className={`w-3 h-3 ${getIndicatorColor()}`} />
      <span className="text-gray-500">
        {lastUpdated ? formatTimestamp(lastUpdated) : "No data"}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:text-blue-500"
          }`}
          title="Refresh data"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}