"use client";

import { useAuth } from "@/lib/auth-context";
import { Users, Calendar, CheckCircle, FileText } from "lucide-react";
import { InfoCard } from "@/components/dashboard/info-card";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500">Here's what's happening in your unit today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard
                    title="Total Cadets"
                    value="124"
                    icon={Users}
                    trend="+12%"
                    color="blue"
                    delay={0.1}
                />
                <InfoCard
                    title="Attendance Rate"
                    value="92%"
                    icon={CheckCircle}
                    trend="+5%"
                    color="green"
                    delay={0.2}
                />
                <InfoCard
                    title="Active Classes"
                    value="3"
                    icon={Calendar}
                    color="orange"
                    delay={0.3}
                />
                <InfoCard
                    title="Pending Reports"
                    value="7"
                    icon={FileText}
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
