import GlassCard from "./GlassCard";

type ActivityFeedItem = {
  text: string;
  time: string;
};

type ActivityFeedProps = {
  activityFeed: ActivityFeedItem[];
};

export default function ActivityFeed({ activityFeed }: ActivityFeedProps) {
  return (
    <GlassCard>
      <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-100" style={{ fontSize: "var(--h2)" }}>
        Activity Feed
      </h2>
      <ul className="space-y-2 text-gray-700 dark:text-gray-200 min-h-[56px] flex flex-col justify-center">
        {activityFeed.length > 0 ? (
          activityFeed.map((item, idx) => (
            <li
              key={idx}
              className="
                flex flex-col sm:flex-row sm:items-center sm:justify-between
                border-b border-gray-800/10 dark:border-gray-700/30 pb-1
                last:border-none
              "
              style={{ fontSize: "var(--body)" }}
            >
              {/* Activity text left, time right (desktop) or stacked (mobile) */}
              <span
                className="block sm:flex-1"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
              <span
                className="
                  text-gray-400 dark:text-gray-400
                  mt-0.5 sm:mt-0 sm:ml-6
                  text-xs sm:text-sm
                  sm:text-right
                  whitespace-nowrap
                "
                style={{
                  minWidth: "135px",
                  fontSize: "var(--small)",
                }}
              >
                {item.time}
              </span>
            </li>
          ))
        ) : (
          <li className="text-center py-2 text-gray-400 dark:text-gray-500" style={{ fontSize: "var(--body)" }}>
            <span role="img" aria-label="sparkles">✨</span> 
            No recent activity. Start by uploading a file or updating your settings!
          </li>
        )}
      </ul>
    </GlassCard>
  );
}
