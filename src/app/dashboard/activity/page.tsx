"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Role } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { History, Filter, UserCheck, BookOpen, Megaphone, Users, FileCheck, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ACTION_ICONS: Record<string, typeof History> = {
    "Enrolled new cadet": Users,
    "Deleted cadet": Users,
    "Created class": BookOpen,
    "Deleted class": BookOpen,
    "Marked attendance": FileCheck,
    "Posted announcement": Megaphone,
    "Deleted announcement": Megaphone,
    "Sent note": MessageSquare,
    "Uploaded certificate": FileCheck,
    "Deleted certificate": FileCheck,
};

const ACTION_COLORS: Record<string, string> = {
    "Enrolled new cadet": "bg-green-100 text-green-600",
    "Deleted cadet": "bg-red-100 text-red-600",
    "Created class": "bg-blue-100 text-blue-600",
    "Deleted class": "bg-red-100 text-red-600",
    "Marked attendance": "bg-teal-100 text-teal-600",
    "Posted announcement": "bg-purple-100 text-purple-600",
    "Deleted announcement": "bg-red-100 text-red-600",
    "Sent note": "bg-amber-100 text-amber-600",
    "Uploaded certificate": "bg-emerald-100 text-emerald-600",
    "Deleted certificate": "bg-red-100 text-red-600",
};

export default function ActivityLogPage() {
    const { user } = useAuth();
    const { activityLog } = useData();
    const router = useRouter();
    const [filterAction, setFilterAction] = useState("ALL");

    // ANO-only access
    useEffect(() => {
        if (user && user.role !== Role.ANO) {
            router.replace("/dashboard");
        }
    }, [user, router]);

    const uniqueActions = useMemo(() => {
        const actions = new Set(activityLog.map(e => e.action));
        return ["ALL", ...Array.from(actions)];
    }, [activityLog]);

    const filteredLog = useMemo(() => {
        if (filterAction === "ALL") return activityLog;
        return activityLog.filter(e => e.action === filterAction);
    }, [activityLog, filterAction]);

    if (!user || user.role !== Role.ANO) return null;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Activity Log</h2>
                <p className="text-gray-500 mt-1">Track all actions performed across the system.</p>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                {uniqueActions.map(action => (
                    <button
                        key={action}
                        onClick={() => setFilterAction(action)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterAction === action
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                    >
                        {action}
                    </button>
                ))}
            </div>

            {filteredLog.length === 0 ? (
                <Card className="border-gray-100">
                    <CardContent className="py-16 text-center">
                        <History className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">No activity recorded yet.</p>
                        <p className="text-gray-300 text-xs mt-1">Actions like enrolling cadets, marking attendance, and posting announcements will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100">
                    <CardContent className="p-0">
                        <div className="relative pl-8 py-6 pr-6">
                            {/* Timeline line */}
                            <div className="absolute left-[18px] top-6 bottom-6 w-0.5 bg-gray-100" />

                            <div className="space-y-6">
                                {filteredLog.map((entry, i) => {
                                    const Icon = ACTION_ICONS[entry.action] || History;
                                    const colorClass = ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-500";

                                    return (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="relative flex items-start"
                                        >
                                            {/* Timeline dot */}
                                            <div className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center ${colorClass} border-2 border-white shadow-sm`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>

                                            <div className="ml-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-800">
                                                        <span className="font-bold">{entry.performedByName}</span>
                                                        {" "}{entry.action.toLowerCase()}
                                                        {entry.targetName && (
                                                            <span className="font-semibold text-primary"> &quot;{entry.targetName}&quot;</span>
                                                        )}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-4">
                                                        {timeAgo(entry.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
