"use client";

interface ActivityItem {
    text: string;
    time: string;
}

interface RecentActivityProps {
    activities?: ActivityItem[];
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
    // Default mock data
    const displayActivities = activities.length > 0 ? activities : [
        { text: "SUO marked attendance for Class 1A", time: "2 hours ago" },
        { text: "Cadet Priya uploaded 'Medical Certificate'", time: "4 hours ago" },
        { text: "New Class 'Weapon Training' scheduled", time: "Yesterday" }
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                {displayActivities.map((item, i) => (
                    <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-secondary shadow-sm"></div>
                        <p className="text-sm font-medium text-gray-800">{item.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
