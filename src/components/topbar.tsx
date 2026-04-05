"use client";

import { useAuth } from "@/lib/auth-context";
import { useCadetData } from "@/lib/cadet-context";
import { useCommunicationData } from "@/lib/communication-context";
import { Role } from "@/types";
import { Bell, Check, Inbox, MessageSquare, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopbarProps {
    onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
    const { user } = useAuth();
    const { messageableUsers } = useCadetData();
    const { notes, markNoteAsRead, markAllAsRead } = useCommunicationData();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadNotes = useMemo(() => {
        if (!user) return [];
        return notes
            .filter(n => n.recipientId === user.id && !n.isRead)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notes, user]);

    const unreadCount = unreadNotes.length;

    if (!user) return null;

    const currentUser = messageableUsers.find(u => u.id === user.id);
    const displayUser = currentUser || user;

    const handleNotificationClick = (id: string) => {
        markNoteAsRead(id);
        setShowNotifications(false);
        router.push("/dashboard/notes");
    };

    return (
        <header className="h-16 border-b border-gray-200/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 w-full shadow-sm dark:shadow-slate-900/30">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-zinc-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none font-bold"
                    aria-label="Toggle menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
                        Welcome back,{" "}
                        {(displayUser.role === Role.ANO)
                            ? displayUser.role
                            : `${displayUser.role === Role.CADET ? "Cadet" : displayUser.role} ${displayUser.name.split(" ")[0]}`
                        }
                    </h1>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight sm:hidden">
                        Dashboard
                    </h1>
                    {user?.unitName && (
                        <span className="text-[10px] font-bold text-primary/70 dark:text-blue-400/70 uppercase tracking-widest -mt-0.5 hidden sm:block">
                            {user.unitName} {user.unitNumber && `(${user.unitNumber})`}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        aria-label={`Notifications (${unreadCount} unread)`}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative group",
                            showNotifications
                                ? "bg-primary/10 dark:bg-primary/20"
                                : "bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700"
                        )}
                    >
                        <Bell className={cn("w-5 h-5 transition-colors", showNotifications ? "text-primary" : "text-zinc-700 dark:text-slate-300")} />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold"
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
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-slate-700/60 overflow-hidden z-[100]"
                                style={{ transformOrigin: "top right" }}
                            >
                                {/* Dropdown Header */}
                                <div className="p-4 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/40">
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span className="ml-2 text-[10px] px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 rounded-full">
                                                {unreadCount} New
                                            </span>
                                        )}
                                    </h2>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead()}
                                            className="text-[11px] font-bold text-primary dark:text-blue-400 hover:text-primary/80 flex items-center transition-colors px-2 py-1 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10"
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[350px] overflow-y-auto">
                                    {unreadNotes.length === 0 ? (
                                        <div className="p-10 text-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
                                                <Inbox className="w-8 h-8 text-gray-300 dark:text-slate-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-zinc-800 dark:text-slate-200">All caught up!</p>
                                                <p className="text-xs text-zinc-700 dark:text-slate-400 font-bold">No new notifications at the moment.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                            {unreadNotes.map((note) => (
                                                <button
                                                    key={note.id}
                                                    onClick={() => handleNotificationClick(note.id)}
                                                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors flex items-start space-x-3"
                                                >
                                                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
                                                        <MessageSquare className="w-5 h-5 text-primary dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate pr-2">
                                                                {note.senderName}
                                                            </p>
                                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
                                                                {new Date(note.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-black text-primary dark:text-blue-400 truncate mb-1 leading-tight">
                                                            {note.subject}
                                                        </p>
                                                        <p className="text-[12px] text-zinc-800 dark:text-slate-300 line-clamp-2 leading-relaxed font-bold">
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
                                    className="flex items-center justify-center space-x-1.5 p-3 text-center text-xs font-black text-zinc-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700/40 border-t border-gray-100 dark:border-slate-700/60 transition-all uppercase tracking-widest"
                                >
                                    <span>View all Private Notes</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center space-x-3 pl-3 md:pl-4 border-l border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <div className="text-right hidden md:block max-w-[120px] lg:max-w-[200px]">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayUser.name}</p>
                        <p className="text-xs text-zinc-800 dark:text-slate-400 truncate font-bold">{displayUser.regimentalNumber}</p>
                    </div>
                    <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold shadow-lg shadow-black/20 overflow-hidden ring-2 ring-white/20 dark:ring-slate-700/50 flex-shrink-0">
                        {displayUser.avatarUrl ? (
                            <Image src={displayUser.avatarUrl} alt={displayUser.name} fill sizes="40px" className="object-cover" />
                        ) : (
                            displayUser.name.charAt(0)
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
