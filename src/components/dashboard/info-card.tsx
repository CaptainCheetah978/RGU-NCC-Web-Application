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
            bg: "bg-primary/5",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            glow: "bg-primary/10"
        },
        green: {
            bg: "bg-green-50",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            glow: "bg-green-500/10"
        },
        orange: {
            bg: "bg-orange-50",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            glow: "bg-orange-500/10"
        },
        red: {
            bg: "bg-secondary/5",
            iconBg: "bg-secondary/10",
            iconColor: "text-secondary",
            glow: "bg-secondary/10"
        }
    };

    const styles = colorStyles[color] || colorStyles.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden bg-white`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none ${styles.glow}`} />

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </motion.div>
    );
}
