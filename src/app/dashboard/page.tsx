"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Users, Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { InfoCard } from "@/components/dashboard/info-card";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AnnouncementsBanner } from "@/components/dashboard/announcements-banner";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";

export default function DashboardPage() {
    const { user } = useAuth();
    const { getStats, messageableUsers } = useData();

    if (!user) return null;

    const stats = getStats(user.id);
    const currentUser = messageableUsers.find(u => u.id === user.id);
    const displayUser = currentUser || user;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500">Here&apos;s what&apos;s happening in your unit today.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <img src="/ncc-logo.png" alt="NCC Logo" className="h-16 w-16 object-contain" />
                    <img src="/rgu-logo.png" alt="RGU Logo" className="h-16 w-16 object-contain" />
                    <div className="flex items-center border-l border-gray-300 pl-4 space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden">
                            {displayUser.avatarUrl ? (
                                <img src={displayUser.avatarUrl} alt={displayUser.name} className="w-full h-full object-cover" />
                            ) : (
                                displayUser.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Welcome back,</p>
                            <p className="text-lg font-bold text-gray-900">{displayUser.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnnouncementsBanner />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard
                    title="Total Cadets"
                    value={stats.totalCadets}
                    icon={Users}
                    color="blue"
                    delay={0.1}
                />
                <InfoCard
                    title="Attendance Rate"
                    value={stats.attendanceRate}
                    icon={CheckCircle}
                    color="green"
                    delay={0.2}
                />
                <InfoCard
                    title="Active Classes"
                    value={stats.activeClasses}
                    icon={Calendar}
                    color="orange"
                    delay={0.3}
                />
                <InfoCard
                    title="Notes Received"
                    value={stats.unreadNotes}
                    icon={MessageSquare}
                    color="red"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <UpcomingClasses />
                <RecentActivity />
            </div>

            <AttendanceChart />
        </div>
    );
}
