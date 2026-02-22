"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useTheme } from "@/lib/theme-context";
import { Role } from "@/types";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    FileText,
    LogOut,
    Shield,
    MessageSquare,
    Megaphone,
    History,
    Sun,
    Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Sidebar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { getStats } = useData();
    const pathname = usePathname();

    if (!user) return null;

    const unreadNotes = getStats(user.id).unreadNotes;

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: [] }, // All
        {
            name: "Classes",
            href: "/dashboard/classes",
            icon: CalendarCheck,
            roles: [Role.ANO, Role.SUO, Role.UO, Role.SGT]
        },
        {
            name: "Attendance",
            href: "/dashboard/attendance",
            icon: Users,
            roles: [Role.ANO, Role.SUO, Role.UO, Role.SGT, Role.CPL]
        },
        {
            name: "Cadet Registry",
            href: "/dashboard/cadets",
            icon: Shield,
            roles: [Role.ANO, Role.SUO]
        },
        {
            name: "Files & Media",
            href: "/dashboard/files",
            icon: FileText,
            roles: [] // All
        },
        {
            name: "Private Notes",
            href: "/dashboard/notes",
            icon: MessageSquare,
            roles: [] // All
        },
        {
            name: "Announcements",
            href: "/dashboard/announcements",
            icon: Megaphone,
            roles: [] // All
        },
        {
            name: "Activity Log",
            href: "/dashboard/activity",
            icon: History,
            roles: [Role.ANO] // ANO only
        },
        {
            name: "My Profile",
            href: "/dashboard/profile",
            icon: Users,
            roles: [] // All
        },
    ];

    const filteredLinks = links.filter(link =>
        link.roles.length === 0 || link.roles.includes(user.role)
    );

    return (
        <div className="h-screen w-64 bg-white/5 dark:bg-slate-900/95 backdrop-blur-xl border-r border-white/10 dark:border-slate-700/50 flex flex-col fixed left-0 top-0 z-20">
            <div className="p-6 flex items-center space-x-3 border-b border-white/10 dark:border-slate-700/50">
                <div className="w-10 h-10 flex items-center justify-center">
                    <img src="/ncc-logo.png" alt="NCC" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">NCC RGU</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {filteredLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link key={link.href} href={link.href}>
                            <div
                                className={cn(
                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "text-white bg-primary shadow-lg shadow-primary/25"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary z-[-1]"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                                <span className="font-medium flex-1">{link.name}</span>
                                {link.href === "/dashboard/notes" && unreadNotes > 0 && (
                                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                        {unreadNotes > 9 ? "9+" : unreadNotes}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 dark:border-slate-700/50 space-y-2">
                <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white w-full transition-colors"
                >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
