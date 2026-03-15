"use client";

import { useTrainingData } from "@/lib/training-context";
import { useCadetData } from "@/lib/cadet-context";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Role, AttendanceRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, Search, Shield } from "lucide-react";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AttendanceExport } from "@/components/attendance/export-button";
import { PdfExportButton } from "@/components/attendance/pdf-export-button";
import { queueAttendanceOffline, getOfflineAttendanceQueue, clearOfflineQueue } from "@/lib/offline-sync";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from "react";

// Helper hook to manage online/offline state
function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof window !== "undefined") return navigator.onLine;
        return true;
    });

    useEffect(() => {
        // Safe check for browser environment


        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}

function AttendanceContent() {
    const { classes, attendance, markAttendance, refreshAttendance } = useTrainingData();
    const { cadets } = useCadetData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isOnline = useNetworkStatus();

    const searchParams = useSearchParams();
    const classIdParam = searchParams.get("classId");

    // Track user's explicit class selection; null means "not yet chosen by user"
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Derive the effective class ID without synchronous setState in an effect:
    // 1. User's manual selection takes priority (if valid)
    // 2. Otherwise fall back to classIdParam from URL (if valid)
    // 3. Otherwise select the first available class
    const effectiveClassId = useMemo(() => {
        if (classes.length === 0) return "";
        if (selectedClassId && classes.find(c => c.id === selectedClassId)) return selectedClassId;
        if (classIdParam && classes.find(c => c.id === classIdParam)) return classIdParam;
        return classes[0].id;
    }, [classes, classIdParam, selectedClassId]);

    // --- Offline Sync Logic ---
    useEffect(() => {
        const checkQueue = async () => {
            const queue = await getOfflineAttendanceQueue();

            if (isOnline && queue.length > 0) {
                // We're back online, let's sync!
                try {
                    showToast(`Syncing ${queue.length} offline records...`);
                    for (const record of queue) {
                        await markAttendance(record);
                    }
                    await clearOfflineQueue();
                    await refreshAttendance();
                    showToast("Offline records synced successfully.");
                } catch (error) {
                    console.error("Failed to sync offline queue", error);
                    showToast("Failed to sync some offline records.");
                }
            }
        };

        checkQueue();
    }, [isOnline, markAttendance, refreshAttendance, showToast]);

    const canMark = user && [Role.ANO, Role.SUO, Role.UO, Role.SGT].includes(user.role);

    const selectedClass = useMemo(
        () => classes.find(c => c.id === effectiveClassId),
        [classes, effectiveClassId]
    );

    // Filter cadets based on search, and implicitly drop 'alumni'
    const filteredCadets = useMemo(() => {
        return cadets.filter(c =>
            c.status !== 'alumni' &&
            (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [cadets, searchQuery]);

    const parentRef = useRef<HTMLDivElement>(null);

    // Setup Virtualizer on the filtered array
    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: filteredCadets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // Estimate height per row
        overscan: 5, // Render 5 rows above/below visible area for smooth scrolling
    });

    const stats = useMemo(() => {
        const classRecords = attendance.filter(r => r.classId === effectiveClassId);
        const activeCadetsCount = cadets.filter(c => c.status !== 'alumni').length;
        return {
            present: classRecords.filter(r => r.status === "PRESENT").length,
            absent: classRecords.filter(r => r.status === "ABSENT").length,
            late: classRecords.filter(r => r.status === "LATE").length,
            total: activeCadetsCount
        };
    }, [attendance, effectiveClassId, cadets]);

    // Pre-build a cadetId → status map for the selected class so each row can look
    // up its status in O(1) instead of scanning the whole attendance array per row.
    const classAttendanceMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord["status"]>();
        for (const r of attendance) {
            if (r.classId === effectiveClassId) map.set(r.cadetId, r.status);
        }
        return map;
    }, [attendance, effectiveClassId]);

    // Memoize the filtered attendance array for the selected class so the export
    // buttons receive a stable reference and don't trigger extra renders.
    const classAttendanceRecords = useMemo(
        () => attendance.filter(r => r.classId === effectiveClassId),
        [attendance, effectiveClassId]
    );

    if (!user) return null;

    const getStatus = (cadetId: string) => classAttendanceMap.get(cadetId) ?? null;

    const handleStatusChange = async (cadetId: string, status: AttendanceRecord["status"]) => {
        if (!canMark) return;

        const payload = {
            id: `${effectiveClassId}-${cadetId}`,
            classId: effectiveClassId,
            cadetId,
            status,
            timestamp: new Date().toISOString()
        };

        if (!isOnline) {
            // Offline mode: queue it
            await queueAttendanceOffline(payload);

            // We need to optimistically update the UI since the server refresh won't happen
            await getOfflineAttendanceQueue();

            showToast("Saved offline. Will sync when reconnected.");
            return;
        }

        try {
            await markAttendance(payload);
        } catch (error) {
            console.error("Failed to mark attendance", error);
            showToast("Failed to mark attendance. Please try again.");
        }
    };

    if (!classes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-140px)]">
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <Shield className="w-12 h-12 text-gray-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Classes Scheduled</h3>
                <p className="text-gray-700 dark:text-slate-400 mt-2 max-w-sm text-center font-medium">There are no classes scheduled to take attendance for. Please ask an administrator to schedule a class.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        Attendance Register
                    </h2>
                    <p className="text-gray-700 dark:text-slate-400 mt-1 font-medium italic">Mark and track attendance for scheduled classes.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                        value={effectiveClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        aria-label="Select Training Class"
                        className="h-10 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.title} • {c.date}</option>
                        ))}
                    </select>

                    {selectedClass && (
                        <div className="flex items-center gap-2">
                            <PdfExportButton
                                classSession={selectedClass}
                                cadets={filteredCadets}
                                attendance={classAttendanceRecords}
                                className="h-10"
                            />
                            <AttendanceExport
                                classSession={selectedClass}
                                cadets={filteredCadets}
                                attendance={classAttendanceRecords}
                                className="h-10"
                            />
                        </div>
                    )}
                </div>
            </div>

            <Card className="bg-white/90 backdrop-blur-xl border-white/20 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/30 dark:bg-slate-900/20">
                    <div className="flex flex-wrap items-center gap-3 text-sm w-full lg:w-auto">
                        <div className="flex items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            <span className="font-medium">Present: {stats.present}</span>
                        </div>
                        <div className="flex items-center text-red-900 bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm">
                            <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                            <span className="font-bold">Absent: {stats.absent}</span>
                        </div>
                        <div className="flex items-center text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">
                            <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                            <span className="font-bold">Late: {stats.late}</span>
                        </div>
                        <div className="text-primary font-bold ml-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                            Strength: {stats.total}
                        </div>
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-primary/50" />
                        <input
                            type="text"
                            placeholder="Search by name or regimental no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search by name or regimental number"
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-900/60 sticky top-0 z-10 shadow-sm">
                            <tr className="text-left text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider block w-full table-fixed">
                                <th className="px-6 py-4 w-[40%]">Cadet Name</th>
                                <th className="px-6 py-4 w-[20%]">Regimental Given ID</th>
                                <th className="px-6 py-4 w-[15%]">Rank</th>
                                <th className="px-6 py-4 w-[25%] text-center">Status</th>
                            </tr>
                        </thead>
                    </table>

                    {/* The scrolling container mapped to virtualizer */}
                    <div ref={parentRef} className="flex-1 overflow-auto w-full">
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            <table className="w-full absolute top-0 left-0">
                                <tbody className="w-full">
                                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                        const cadet = filteredCadets[virtualItem.index];
                                        const status = getStatus(cadet.id);
                                        return (
                                            <motion.tr
                                                key={cadet.id}
                                                // Adjust visual row translation based on virtual array
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualItem.size}px`,
                                                    transform: `translateY(${virtualItem.start}px)`,
                                                }}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors group flex table-fixed w-full items-center border-b border-gray-100 dark:border-slate-700/50"
                                            >
                                                <td className="px-6 py-3 w-[40%] text-sm">
                                                    <div className="flex items-center">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-xs font-bold text-primary mr-3 border border-primary/10 shrink-0">
                                                            {cadet.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-gray-900 dark:text-white truncate">{cadet.name}</div>
                                                            <div className="text-xs text-gray-600 md:hidden font-medium truncate">{cadet.regimentalNumber}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-800 dark:text-slate-400 font-bold tracking-wide hidden md:block w-[20%] truncate">
                                                    {cadet.regimentalNumber || "-"}
                                                </td>
                                                <td className="px-6 py-3 text-sm w-[15%]">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-md text-xs font-semibold border inline-block whitespace-nowrap",
                                                        cadet.role === Role.SUO ? "bg-amber-50 text-amber-700 border-amber-100 ring-1 ring-amber-500/10" :
                                                            cadet.role === Role.UO ? "bg-gray-100 text-gray-700 border-gray-200 ring-1 ring-gray-500/10" :
                                                                "bg-primary/5 text-primary border-primary/10"
                                                    )}>
                                                        {cadet.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 w-[25%] flex justify-center h-full items-center">
                                                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                                        <button
                                                            disabled={!canMark}
                                                            onClick={() => handleStatusChange(cadet.id, "PRESENT")}
                                                            aria-label={`Mark ${cadet.name} Present`}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                                status === "PRESENT"
                                                                    ? "bg-green-500 text-white shadow-md shadow-green-500/20 scale-105"
                                                                    : "bg-gray-100 dark:bg-slate-700/50 text-gray-700 hover:bg-green-50 hover:text-green-700"
                                                            )}
                                                            title="Mark Present"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            disabled={!canMark}
                                                            onClick={() => handleStatusChange(cadet.id, "ABSENT")}
                                                            aria-label={`Mark ${cadet.name} Absent`}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                                status === "ABSENT"
                                                                    ? "bg-red-500 text-white shadow-md shadow-red-500/20 scale-105"
                                                                    : "bg-gray-100 dark:bg-slate-700/50 text-gray-700 hover:bg-red-50 hover:text-red-700"
                                                            )}
                                                            title="Mark Absent"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            disabled={!canMark}
                                                            onClick={() => handleStatusChange(cadet.id, "LATE")}
                                                            aria-label={`Mark ${cadet.name} Late`}
                                                            className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                                                                status === "LATE"
                                                                    ? "bg-yellow-500 text-white shadow-md shadow-yellow-500/20 scale-105"
                                                                    : "bg-gray-100 dark:bg-slate-700/50 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
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
                        </div>
                    </div>
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
