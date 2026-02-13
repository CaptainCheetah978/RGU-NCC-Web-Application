"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-900 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 bg-[#f3f4f6]">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231d2951' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
