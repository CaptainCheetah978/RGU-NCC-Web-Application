"use client";

import { useTrainingData } from "@/lib/training-context";
import { useAuth } from "@/lib/auth-context";
import { Calendar } from "lucide-react";
import { Permissions } from "@/lib/permissions";
import Link from "next/link";

export function UpcomingClasses() {
    const { classes } = useTrainingData();
    const { user } = useAuth();

    return (
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/60">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Upcoming Classes</h3>
            {classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-400 dark:text-slate-400" />
                    </div>
                    <p className="text-gray-700 dark:text-slate-400 font-medium">No Upcoming Classes</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Classes will appear here once scheduled</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {classes.map((cls) => {
                        const date = new Date(cls.date);
                        return (
                            <div key={cls.id} className="flex items-center p-4 rounded-xl border border-gray-100 dark:border-slate-700/60 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-primary/5 dark:bg-primary/20 border border-primary/20 flex-shrink-0 flex flex-col items-center justify-center text-primary dark:text-blue-400 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="text-xs uppercase">{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                                    <span className="text-lg leading-none">{date.getDate()}</span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white">{cls.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">{cls.time}</p>
                                </div>
                                {(user?.role && Permissions.CAN_MANAGE_ATTENDANCE.has(user.role)) && (
                                    <Link href={`/dashboard/attendance?classId=${cls.id}`}>
                                        <button className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 dark:bg-primary/10 rounded-lg hover:bg-primary hover:text-white transition-all">
                                            View
                                        </button>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
