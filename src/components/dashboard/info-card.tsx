"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface InfoCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: "blue" | "green" | "orange" | "red";
    delay?: number;
}

export function InfoCard({ title, value, icon: Icon, trend, color, delay = 0 }: InfoCardProps) {
    const colorStyles = {
        blue: {
            iconBg: "bg-primary/10 dark:bg-primary/20",
            iconColor: "text-primary dark:text-blue-400",
            glow: "bg-primary/10 dark:bg-primary/20",
            accent: "from-primary/5 to-transparent dark:from-primary/10",
        },
        green: {
            iconBg: "bg-green-100 dark:bg-green-500/20",
            iconColor: "text-green-600 dark:text-green-400",
            glow: "bg-green-400/10 dark:bg-green-400/15",
            accent: "from-green-500/5 to-transparent dark:from-green-500/10",
        },
        orange: {
            iconBg: "bg-orange-100 dark:bg-orange-500/20",
            iconColor: "text-orange-600 dark:text-orange-400",
            glow: "bg-orange-500/10 dark:bg-orange-400/15",
            accent: "from-orange-500/5 to-transparent dark:from-orange-500/10",
        },
        red: {
            iconBg: "bg-secondary/10 dark:bg-secondary/20",
            iconColor: "text-secondary dark:text-red-400",
            glow: "bg-secondary/10 dark:bg-secondary/20",
            accent: "from-secondary/5 to-transparent dark:from-secondary/10",
        },
    };

    const styles = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="rounded-2xl p-6 shadow-sm dark:shadow-slate-900/40 border border-gray-100 dark:border-slate-700/60 hover:shadow-md dark:hover:shadow-slate-900/60 transition-all duration-300 relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm group"
        >
            {/* Gradient accent top-left */}
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.accent} pointer-events-none`} />
            {/* Glow blob */}
            <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-60 ${styles.glow}`} />

            <div className="relative flex justify-between items-start">
                <div>
                    <p className="text-gray-700 dark:text-slate-400 text-sm font-bold">{title}</p>
                    <h3 className="text-3xl font-black text-black dark:text-white mt-1 tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className="relative mt-4 flex items-center text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        {trend}
                    </span>
                    <span className="text-gray-600 dark:text-slate-500 ml-2 font-medium">vs last month</span>
                </div>
            )}
        </motion.div>
    );
}
