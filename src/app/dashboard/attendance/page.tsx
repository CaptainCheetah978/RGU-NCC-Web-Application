"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, AttendanceRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Clock, Search, Save } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function AttendancePage() {
    const { classes, cadets, attendance, markAttendance } = useData();
    const { user } = useAuth();

    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");
    const [searchQuery, setSearchQuery] = useState("");

    const canMark = user && [Role.ANO, Role.SUO, Role.UO, Role.SGT].includes(user.role);

    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Filter cadets based on search
    const filteredCadets = useMemo(() => {
        return cadets.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [cadets, searchQuery]);

    const getStatus = (cadetId: string) => {
        const record = attendance.find(
            r => r.classId === selectedClassId && r.cadetId === cadetId
        );
        return record?.status || null;
    };

    const handleStatusChange = (cadetId: string, status: AttendanceRecord["status"]) => {
        if (!canMark) return;
        markAttendance({
            id: `${selectedClassId}-${cadetId}`,
            classId: selectedClassId,
            cadetId,
            status,
            timestamp: new Date().toISOString()
        });
    };

    // Calculate stats
    const stats = useMemo(() => {
        const classRecords = attendance.filter(r => r.classId === selectedClassId);
        return {
            present: classRecords.filter(r => r.status === "PRESENT").length,
            absent: classRecords.filter(r => r.status === "ABSENT").length,
            total: cadets.length // Assuming all cadets should attend for simplicity
        };
    }, [attendance, selectedClassId, cadets.length]);


    if (!classes.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <p className="text-gray-500">No classes scheduled to take attendance for.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Attendance Register</h2>
                    <p className="text-gray-500 mt-1">Mark present, absent, or late for cadets.</p>
                </div>

                <div className="flex items-center space-x-4">
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.title} ({c.date})</option>
                        ))}
                    </select>
                </div>
            </div>

            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Present: {stats.present}
                        </div>
                        <div className="flex items-center text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            Absent: {stats.absent}
                        </div>
                        <div className="text-gray-400">
                            Total Strength: {cadets.length}
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search cadet..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-none text-sm focus:ring-2 focus:ring-primary/10 transition-shadow outline-none"
                        />
                    </div>
                </div>

                <CardContent className="p-0 flex-1 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 sticky top-0 z-10">
                            <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Cadet Name</th>
                                <th className="px-6 py-4">Regimental No</th>
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCadets.map((cadet) => {
                                const status = getStatus(cadet.id);
                                return (
                                    <motion.tr
                                        key={cadet.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                                    {cadet.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{cadet.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {cadet.regimentalNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                {cadet.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "PRESENT")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                        status === "PRESENT"
                                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110"
                                                            : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                                                    )}
                                                    title="Present"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "ABSENT")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                        status === "ABSENT"
                                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
                                                            : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                                    )}
                                                    title="Absent"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    disabled={!canMark}
                                                    onClick={() => handleStatusChange(cadet.id, "LATE")}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                        status === "LATE"
                                                            ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-110"
                                                            : "bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600"
                                                    )}
                                                    title="Late"
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
