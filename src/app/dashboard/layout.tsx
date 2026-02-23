"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-slate-950 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 bg-gray-100 dark:bg-slate-900">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Subtle dot-grid background pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
                        style={{
                            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                            backgroundSize: "28px 28px",
                        }}
                    />
                    {/* Dark mode ambient glow top-right */}
                    <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
