"use client";

import { useCallback } from "react";
import { useCadetData } from "@/lib/cadet-context";
import { useTrainingData } from "@/lib/training-context";
import { useCommunicationData } from "@/lib/communication-context";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types";


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
    const { user } = useAuth();

    const getStats = useCallback(
        (): DashboardStats => {
            const userId = user?.id;
            const userRole = user?.role;
            const totalCadets = cadets.length;
            const classIds = new Set(classes.map((c) => c.id));

            // Staff roles see aggregate unit attendance. Cadets/Junior ranks see personal.
            const isStaff = userRole === Role.ANO || userRole === Role.SUO || userRole === Role.UO || userRole === Role.SGT;

            const validAttendance = attendance.filter(
                (a) => classIds.has(a.classId) && (isStaff || !userId || a.cadetId === userId)
            );
            const totalAttendanceRecords = validAttendance.length;
            const presentCount = validAttendance.filter((a) => a.status === "PRESENT").length;
            const attendanceRate =
                totalAttendanceRecords > 0 ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%` : "0%";
            const activeClasses = classes.length;
            const unreadNotes = userId ? notes.filter((n) => n.recipientId === userId && !n.isRead).length : 0;
            return { totalCadets, attendanceRate, activeClasses, unreadNotes };
        },
        [attendance, cadets, classes, notes, user]
    );

    return getStats;
}
