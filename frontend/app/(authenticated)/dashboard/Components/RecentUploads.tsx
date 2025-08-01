import GlassCard from "./GlassCard";
import type { RecentFile } from "../types";

type RecentUploadsProps = {
  recentFiles: RecentFile[];
};

export default function RecentUploads({ recentFiles }: RecentUploadsProps) {
  return (
    <GlassCard>
      <h2 className="font-semibold mb-2 text-gray-700 dark:text-gray-100 flex items-center gap-2"
        style={{ fontSize: "var(--h2)" }}>
        <span style={{ fontSize: "var(--body)" }}>🕒</span> Recent Uploads
      </h2>
      {Array.isArray(recentFiles) && recentFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse" style={{ fontSize: "var(--body)" }}>
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Filename</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Rows</th>
                <th className="px-4 py-2 border-b border-gray-200 dark:border-gray-700" style={{ fontSize: "var(--small)" }}>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((file, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-medium">{file?.file_name || "N/A"}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">{file?.row_count ?? "-"}</td>
                  <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    {file?.uploaded_at
                      ? new Date(file.uploaded_at).toLocaleString()
                      : "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2" style={{ fontSize: "var(--small)", color: "inherit" }}>No recent uploads found.</p>
      )}
    </GlassCard>
  );
}
