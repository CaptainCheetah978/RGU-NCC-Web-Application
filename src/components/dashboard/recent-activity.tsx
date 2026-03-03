"use client";

import { useData } from "@/lib/data-context";

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RecentActivity() {
    const { getRecentActivities } = useData();
    const activities = getRecentActivities(5);

    const displayActivities = activities.length > 0
        ? activities.map(a => ({
            text: `${a.performedByName} ${a.action.toLowerCase()}${a.targetName ? ` "${a.targetName}"` : ""}`,
            time: timeAgo(a.timestamp),
        }))
        : [
            { text: "No recent activity recorded.", time: "" },
        ];

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/60">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Recent Activity</h3>
            <div className="relative pl-4 border-l-2 border-gray-200 dark:border-slate-700 space-y-6">
                {displayActivities.map((item, i) => (
                    <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-secondary shadow-sm"></div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200">{item.text}</p>
                        {item.time && <p className="text-xs text-gray-600 dark:text-slate-500 mt-1 font-medium">{item.time}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
