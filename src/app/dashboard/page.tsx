"use client";

import { useAuth } from "@/lib/auth-context";
import { useCadetData } from "@/lib/cadet-context";
import { useDashboardStats } from "@/lib/dashboard-stats";
import { Users, Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { InfoCard } from "@/components/dashboard/info-card";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AnnouncementsBanner } from "@/components/dashboard/announcements-banner";
import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import Image from "next/image";

export default function DashboardPage() {
    const { user } = useAuth();
    const { messageableUsers } = useCadetData();
    const getStats = useDashboardStats();

    if (!user) return null;

    const stats = getStats();
    const currentUser = messageableUsers.find(u => u.id === user.id);
    const displayUser = currentUser || user;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
                    <p className="text-zinc-800 dark:text-slate-400 font-bold italic">Here&apos;s what&apos;s happening in your unit today.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Image src="/ncc-logo.png" alt="NCC Logo" width={64} height={64} className="h-10 w-10 md:h-16 md:w-16 object-contain dark:drop-shadow-[0_0_8px_rgba(75,146,219,0.4)]" />
                    <Image src="/rgu-logo.png" alt="RGU Logo" width={64} height={64} className="h-10 w-10 md:h-16 md:w-16 object-contain dark:drop-shadow-[0_0_8px_rgba(240,85,35,0.4)]" />
                    <div className="flex items-center border-l border-gray-300 dark:border-slate-700 pl-4 space-x-3 shrink-0 hidden sm:flex">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden shrink-0">
                            {displayUser.avatarUrl ? (
                                <Image src={displayUser.avatarUrl} alt={displayUser.name} width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                                displayUser.name.charAt(0)
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs md:text-sm text-zinc-600 dark:text-slate-300">Welcome back,</p>
                            <p className="text-sm md:text-lg font-bold text-gray-900 dark:text-white truncate max-w-[120px] lg:max-w-[200px]">{displayUser.name}</p>
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
                    title="Unread Notes"
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
