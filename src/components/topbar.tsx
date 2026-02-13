"use client";

import { useAuth } from "@/lib/auth-context";
import { Bell } from "lucide-react";

export function Topbar() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10 w-full shadow-sm">
            <h1 className="text-xl font-bold text-black tracking-tight">
                Welcome back, {user.role === "CADET" ? "Cadet" : user.role} {user.name.split(" ")[0]}
            </h1>

            <div className="flex items-center space-x-4">
                <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-black">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.regimentalNumber}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-bold shadow-lg shadow-black/20">
                        {user.name.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
}
