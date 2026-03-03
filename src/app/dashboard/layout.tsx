"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    if (isLoading) return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Loading session…</p>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden text-gray-900 dark:text-white">
            <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
            <div className="flex-1 flex flex-col md:ml-64 bg-white dark:bg-slate-900 transition-all duration-300 relative max-w-full">
                <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
                    {/* Subtle dot-grid background pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                        style={{
                            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                            backgroundSize: "28px 28px",
                        }}
                    />
                    {/* Dark mode ambient glow top-right */}
                    <div className="hidden md:block absolute top-0 right-0 w-[500px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
