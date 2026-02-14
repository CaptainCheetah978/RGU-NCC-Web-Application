"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Role } from "@/types";
import { Bell, Check, Inbox, MessageSquare, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function Topbar() {
    const { user } = useAuth();
    const { messageableUsers, notes, markNoteAsRead, markAllAsRead } = useData();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get unread notes for the current user — must be above the early return to satisfy Rules of Hooks
    const unreadNotes = useMemo(() => {
        if (!user) return [];
        return notes
            .filter(n => n.recipientId === user.id && !n.isRead)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notes, user]);

    const unreadCount = unreadNotes.length;

    // Early return AFTER all hooks
    if (!user) return null;

    // Get the most up-to-date user data (including extras like photos)
    const currentUser = messageableUsers.find(u => u.id === user.id);
    const displayUser = currentUser || user;

    const handleNotificationClick = (id: string) => {
        markNoteAsRead(id);
        setShowNotifications(false);
        router.push("/dashboard/notes");
    };

    return (
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-50 w-full shadow-sm">
            <h1 className="text-xl font-bold text-black tracking-tight">
                Welcome back, {
                    (displayUser.role === Role.ANO || displayUser.role === Role.SUO)
                        ? displayUser.role
                        : `${displayUser.role === Role.CADET ? "Cadet" : displayUser.role} ${displayUser.name.split(" ")[0]}`
                }
            </h1>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative group",
                            showNotifications ? "bg-primary/10" : "bg-gray-100 hover:bg-gray-200"
                        )}
                    >
                        <Bell className={cn("w-5 h-5 transition-colors", showNotifications ? "text-primary" : "text-gray-600")} />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                            >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </motion.span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                                style={{ transformOrigin: "top right" }}
                            >
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h3 className="font-bold text-gray-900 flex items-center">
                                        Notifications
                                        {unreadCount > 0 && <span className="ml-2 text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">{unreadCount} New</span>}
                                    </h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead(user.id)}
                                            className="text-[11px] font-bold text-primary hover:text-primary-dark flex items-center transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {unreadNotes.length === 0 ? (
                                        <div className="p-10 text-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                                <Inbox className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-gray-600">All caught up!</p>
                                                <p className="text-xs text-gray-400">No new notifications at the moment.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {unreadNotes.map((note) => (
                                                <button
                                                    key={note.id}
                                                    onClick={() => handleNotificationClick(note.id)}
                                                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors group flex start space-x-3"
                                                >
                                                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                                                        <MessageSquare className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-xs font-bold text-gray-900 truncate pr-2">
                                                                {note.senderName}
                                                            </p>
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                                                                {new Date(note.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-primary/80 truncate mb-1 leading-tight">
                                                            {note.subject}
                                                        </p>
                                                        <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                                                            {note.content}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href="/dashboard/notes"
                                    onClick={() => setShowNotifications(false)}
                                    className="block p-3 text-center text-xs font-bold text-gray-500 hover:text-primary hover:bg-gray-50 border-t border-gray-100 transition-all flex items-center justify-center space-x-1.5"
                                >
                                    <span>View all Private Notes</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-black">{displayUser.name}</p>
                        <p className="text-xs text-gray-600">{displayUser.regimentalNumber}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold shadow-lg shadow-black/20 overflow-hidden">
                        {displayUser.avatarUrl ? (
                            <img src={displayUser.avatarUrl} alt={displayUser.name} className="w-full h-full object-cover" />
                        ) : (
                            displayUser.name.charAt(0)
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
