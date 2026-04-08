"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Once the user loads successfully at least once, don't redirect on
    // transient null states caused by background token refreshes.
    const [hasEverLoaded, setHasEverLoaded] = useState(false);

    // Modern React adjustment pattern: adjust state during render if it depends on props/other state
    if (user && !hasEverLoaded) {
        setHasEverLoaded(true);
    }

    useEffect(() => {
        // Only redirect if auth has finished loading AND user is null AND
        // we never had a user in this session (prevents flash redirects
        // during Supabase token refresh cycles).
        if (!isLoading && !user && !hasEverLoaded) {
            router.replace("/");
        }
    }, [user, isLoading, router, hasEverLoaded]);

    if (isLoading && !hasEverLoaded) return null;

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden text-gray-900 dark:text-white">
            <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
            <div className="flex-1 flex flex-col md:ml-64 bg-white dark:bg-slate-900 transition-all duration-300 relative max-w-full">
                <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative pb-[env(safe-area-inset-bottom)]">
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
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative z-10"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
