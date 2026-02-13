"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Users, Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { InfoCard } from "@/components/dashboard/info-card";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
    const { user } = useAuth();
    const { getStats } = useData();

    if (!user) return null;

    const stats = getStats(user.id);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500">Here's what's happening in your unit today.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <img src="/ncc-logo.png" alt="NCC" className="h-16 w-16 object-contain" />
                    <img src="/rgu-logo.png" alt="RGU" className="h-16 w-auto object-contain" />
                    <div className="border-l border-gray-300 pl-4">
                        <p className="text-sm text-gray-500">Welcome back,</p>
                        <p className="text-lg font-bold text-gray-900">{user.name}</p>
                    </div>
                </div>
            </div>

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
        </div>
    );
}
