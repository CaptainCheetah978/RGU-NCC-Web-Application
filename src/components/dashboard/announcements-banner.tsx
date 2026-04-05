"use client";

import { useMemo } from "react";
import { useCommunicationData } from "@/lib/communication-context";
import { Megaphone, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AnnouncementsBanner() {
    const { announcements } = useCommunicationData();

    const sorted = useMemo(() =>
        [...announcements]
            .sort((a, b) => {
                if (a.priority === "urgent" && b.priority !== "urgent") return -1;
                if (b.priority === "urgent" && a.priority !== "urgent") return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 3),
        [announcements]
    );

    if (sorted.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                    <Megaphone className="w-4 h-4 mr-2 text-secondary" />
                    Announcements
                </h3>
                <Link
                    href="/dashboard/announcements"
                    className="text-xs font-bold text-primary dark:text-blue-400 hover:underline flex items-center"
                >
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sorted.map((ann, i) => (
                    <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl border transition-all ${ann.priority === "urgent"
                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 shadow-sm"
                            : "bg-white/80 dark:bg-slate-800/80 border-gray-100 dark:border-slate-700/60 shadow-sm backdrop-blur-sm"
                            }`}
                    >
                        <div className="flex items-start space-x-2">
                            {ann.priority === "urgent" && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                                <h4 className={`text-sm font-bold truncate ${ann.priority === "urgent"
                                    ? "text-red-800 dark:text-red-300"
                                    : "text-gray-900 dark:text-white"
                                    }`}>
                                    {ann.title}
                                </h4>
                                <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${ann.priority === "urgent"
                                    ? "text-red-900 dark:text-slate-400"
                                    : "text-gray-600 dark:text-slate-400"
                                    }`}>
                                    {ann.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={`text-[10px] font-bold ${ann.priority === "urgent"
                                        ? "text-red-700 dark:text-slate-400"
                                        : "text-gray-600 dark:text-slate-400"
                                        }`}>
                                        {ann.authorName}
                                    </span>
                                    <span className={`text-[10px] ${ann.priority === "urgent"
                                        ? "text-red-700 dark:text-slate-400"
                                        : "text-gray-600 dark:text-slate-400"
                                        }`}>
                                        {new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
