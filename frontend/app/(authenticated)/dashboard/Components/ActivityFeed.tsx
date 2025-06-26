import GlassCard from "./GlassCard";

export default function ActivityFeed({ activityFeed }) {
  return (
    <GlassCard>
      <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-100" style={{ fontSize: "var(--h2)" }}>
        Activity Feed
      </h2>
      <ul className="space-y-2 text-gray-700 dark:text-gray-200 min-h-[56px] flex flex-col justify-center">
        {activityFeed.length > 0 ? (
          activityFeed.map((item, idx) => (
            <li key={idx} className="flex items-center" style={{ fontSize: "var(--body)" }}>
              <span className="mr-2" dangerouslySetInnerHTML={{ __html: item.text }} />
              <span className="ml-2 text-gray-400 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>{item.time}</span>
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
