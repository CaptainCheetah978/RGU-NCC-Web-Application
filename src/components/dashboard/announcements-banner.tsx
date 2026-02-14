"use client";

import { useData } from "@/lib/data-context";
import { Megaphone, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AnnouncementsBanner() {
    const { announcements } = useData();

    // Show latest 3 announcements, urgent first
    const sorted = [...announcements]
        .sort((a, b) => {
            if (a.priority === "urgent" && b.priority !== "urgent") return -1;
            if (b.priority === "urgent" && a.priority !== "urgent") return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 3);

    if (sorted.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <Megaphone className="w-4 h-4 mr-2 text-secondary" />
                    Announcements
                </h3>
                <Link
                    href="/dashboard/announcements"
                    className="text-xs font-bold text-primary hover:underline flex items-center"
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
                                ? "bg-red-50 border-red-200 shadow-sm shadow-red-100"
                                : "bg-white border-gray-100 shadow-sm"
                            }`}
                    >
                        <div className="flex items-start space-x-2">
                            {ann.priority === "urgent" && (
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                                <h4 className={`text-sm font-bold truncate ${ann.priority === "urgent" ? "text-red-800" : "text-gray-900"
                                    }`}>
                                    {ann.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                    {ann.content}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {ann.authorName}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
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
