"use client";

import { useCallback } from "react";
import { useCadetData } from "./cadet-context";
import { useTrainingData } from "./training-context";
import { useCommunicationData } from "./communication-context";

export interface DashboardStats {
    totalCadets: number;
    attendanceRate: string;
    activeClasses: number;
    unreadNotes: number;
}

export function useDashboardStats() {
    const { cadets } = useCadetData();
    const { classes, attendance } = useTrainingData();
    const { notes } = useCommunicationData();

    const getStats = useCallback(
        (userId?: string): DashboardStats => {
            const totalCadets = cadets.length;
            const classIds = new Set(classes.map((c) => c.id));
            const validAttendance = attendance.filter(
                (a) => classIds.has(a.classId) && (!userId || a.cadetId === userId)
            );
            const totalAttendanceRecords = validAttendance.length;
            const presentCount = validAttendance.filter((a) => a.status === "PRESENT").length;
            const attendanceRate =
                totalAttendanceRecords > 0 ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%` : "0%";
            const activeClasses = classes.length;
            const unreadNotes = userId ? notes.filter((n) => n.recipientId === userId && !n.isRead).length : 0;
            return { totalCadets, attendanceRate, activeClasses, unreadNotes };
        },
        [attendance, cadets, classes, notes]
    );

    return getStats;
}
