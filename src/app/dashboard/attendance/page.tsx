"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, AttendanceRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, Search, Shield } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AttendanceExport } from "@/components/attendance/export-button";

function AttendanceContent() {
    const { classes, cadets, attendance, markAttendance } = useData();
    const { user } = useAuth();

    const searchParams = useSearchParams();
    const classIdParam = searchParams.get("classId");

    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (classes.length > 0) {
            if (classIdParam && classes.find(c => c.id === classIdParam)) {
                setSelectedClassId(classIdParam || "");
            } else if (!selectedClassId) {
                setSelectedClassId(classes[0].id);
            }
        }
    }, [classes, classIdParam, selectedClassId]);

    const canMark = user && [Role.ANO, Role.SUO, Role.UO, Role.SGT].includes(user.role);

    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Filter cadets based on search
    const filteredCadets = useMemo(() => {
        return cadets.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [cadets, searchQuery]);

    const stats = useMemo(() => {
        const classRecords = attendance.filter(r => r.classId === selectedClassId);
        return {
            present: classRecords.filter(r => r.status === "PRESENT").length,
            absent: classRecords.filter(r => r.status === "ABSENT").length,
            late: classRecords.filter(r => r.status === "LATE").length,
            total: cadets.length
        };
    }, [attendance, selectedClassId, cadets.length]);

    if (!user) return null;

    const getStatus = (cadetId: string) => {
        const record = attendance.find(
            r => r.classId === selectedClassId && r.cadetId === cadetId
        );
        return record?.status || null;
    };

    const handleStatusChange = async (cadetId: string, status: AttendanceRecord["status"]) => {
        if (!canMark) return;
        // Optimistic update or just wait? 
        // For attendance, speed is key. Optimistic update would be best, but complex to implement without local state management or SWR/TanStack Query.
        // For now, let's just await it and maybe add a small loading indicator on the specific button if needed? 
        // Or just let it update. Supabase is fast.

        try {
            await markAttendance({
                id: `${selectedClassId}-${cadetId}`,
                classId: selectedClassId,
                cadetId,
                status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error("Failed to mark attendance", error);
            alert("Failed to mark attendance. Please try again.");
        }
    };

    if (!classes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-140px)]">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Shield className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Classes Scheduled</h3>
                <p className="text-gray-500 mt-2 max-w-sm text-center">There are no classes scheduled to take attendance for. Please ask an administrator to schedule a class.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance Register</h2>
                    <p className="text-gray-500 mt-1">Mark and track attendance for scheduled classes.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.title} • {c.date}</option>
                        ))}
                    </select>

                    {selectedClass && (
                        <AttendanceExport
                            classSession={selectedClass}
                            cadets={filteredCadets}
                            attendance={attendance.filter(r => r.classId === selectedClassId)}
                            className="h-10"
                        />
                    )}
                </div>
            </div>

            <Card className="bg-white/90 backdrop-blur-xl border-white/20 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/30">
                    <div className="flex flex-wrap items-center gap-3 text-sm w-full lg:w-auto">
                        <div className="flex items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="font-medium">Present: {stats.present}</span>
                        </div>
                        <div className="flex items-center text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            <span className="font-medium">Absent: {stats.absent}</span>
                        </div>
                        <div className="flex items-center text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                            <span className="font-medium">Late: {stats.late}</span>
                        </div>
                        <div className="text-primary font-medium ml-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                            Strength: {cadets.length}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-primary/50" />
                        <input
                            type="text"
                            placeholder="Search by name or regimental no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                <CardContent className="p-0 flex-1 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4 w-[40%]">Cadet Name</th>
                                <th className="px-6 py-4 w-[20%]">Regimental Given ID</th>
                                <th className="px-6 py-4 w-[15%]">Rank</th>
                                <th className="px-6 py-4 w-[25%] text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredCadets.map((cadet) => {
                                const status = getStatus(cadet.id);
                                return (
                                    <motion.tr
                                        key={cadet.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <td className="px-6 py-3">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-xs font-bold text-primary mr-3 border border-primary/10">
                                                    {cadet.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{cadet.name}</div>
                                                    <div className="text-xs text-gray-400 md:hidden">{cadet.regimentalNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500 font-mono tracking-wide hidden md:table-cell">
                                            {cadet.regimentalNumber || "-"}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-md text-xs font-semibold border",
                                                cadet.role === Role.SUO ? "bg-amber-50 text-amber-700 border-amber-100 ring-1 ring-amber-500/10" :
                                                    cadet.role === Role.UO ? "bg-gray-100 text-gray-700 border-gray-200 ring-1 ring-gray-500/10" :
                                                        "bg-primary/5 text-primary border-primary/10"
                                            )}>
                                                {cadet.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "PRESENT")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                        status === "PRESENT"
                                                            ? "bg-green-500 text-white shadow-md shadow-green-500/20 scale-105"
                                                            : "bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                                    )}
                                                    title="Mark Present"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "ABSENT")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                        status === "ABSENT"
                                                            ? "bg-red-500 text-white shadow-md shadow-red-500/20 scale-105"
                                                            : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                    )}
                                                    title="Mark Absent"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "LATE")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                        status === "LATE"
                                                            ? "bg-yellow-500 text-white shadow-md shadow-yellow-500/20 scale-105"
                                                            : "bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600"
                                                    )}
                                                    title="Mark Late"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AttendancePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-140px)] text-gray-500">Loading attendance...</div>}>
            <AttendanceContent />
        </Suspense>
    );
}
