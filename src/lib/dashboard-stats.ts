"use client";

import { useCallback } from "react";
import { useCadetData } from "@/lib/cadet-context";
import { useTrainingData } from "@/lib/training-context";
import { useCommunicationData } from "@/lib/communication-context";
import { useAuth } from "@/lib/auth-context";

import { Permissions } from "@/lib/permissions";


export interface DashboardStats {
    totalCadetsLine: string; // Label for the first card
    totalCadetsValue: string | number;
    attendanceRateLine: string; // Label for the second card
    attendanceRateValue: string;
    activeClassesLine: string; // Label for the third card
    activeClassesValue: number;
    unreadNotesValue: number;
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

            // Staff roles see aggregate unit analytics. Junior ranks see personal.
            const isStaff = userRole && Permissions.CAN_MANAGE_ATTENDANCE.has(userRole);

            // 1. First Card: Total Cadets (Staff) vs Personal Rank (Cadet)
            let totalCadetsLine = "Total Cadets";
            let totalCadetsValue: string | number = cadets.length;

            if (!isStaff) {
                totalCadetsLine = "My Rank";
                totalCadetsValue = userRole || "CADET";
            }

            // 2. Second Card: Unit Attendance (Staff) vs My Attendance (Cadet)
            const classIds = new Set(classes.map((c) => c.id));
            const validAttendance = attendance.filter(
                (a) => classIds.has(a.classId) && (isStaff || (userId && a.cadetId === userId))
            );
            const totalAttendanceRecords = validAttendance.length;
            const presentCount = validAttendance.filter((a) => a.status === "PRESENT").length;
            const attendanceRateValue =
                totalAttendanceRecords > 0 ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%` : "0%";
            const attendanceRateLine = isStaff ? "Attendance Rate" : "My Attendance";

            // 3. Third Card: Total Unit Classes (Staff) vs Classes Attended (Cadet)
            let activeClassesLine = "Active Classes";
            let activeClassesValue = classes.length;

            if (!isStaff) {
                activeClassesLine = "Attended Count";
                activeClassesValue = attendance.filter(a => a.cadetId === userId && a.status === "PRESENT").length;
            }

            // 4. Fourth Card: Unread Notes (Always personal)
            const unreadNotesValue = userId ? notes.filter((n) => n.recipientId === userId && !n.isRead).length : 0;

            return {
                totalCadetsLine,
                totalCadetsValue,
                attendanceRateLine,
                attendanceRateValue,
                activeClassesLine,
                activeClassesValue,
                unreadNotesValue
            };
        },
        [attendance, cadets, classes, notes, user]
    );

    return getStats;
}
