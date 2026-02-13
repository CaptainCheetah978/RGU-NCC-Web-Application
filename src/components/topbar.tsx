"use client";

import { useAuth } from "@/lib/auth-context";
import { Bell } from "lucide-react";

export function Topbar() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <header className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <h1 className="text-xl font-bold text-white tracking-tight">
                Welcome back, {user.role === "CADET" ? "Cadet" : user.role} {user.name.split(" ")[0]}
            </h1>

            <div className="flex items-center space-x-4">
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0f1730]"></span>
                </button>
                <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.regimentalNumber}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold shadow-lg shadow-black/20">
                        {user.name.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
}
