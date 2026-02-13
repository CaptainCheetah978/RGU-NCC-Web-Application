"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AttendanceRecord, Cadet, ClassSession } from "@/types";

interface AttendanceExportProps {
    classSession?: ClassSession;
    cadets: Cadet[];
    attendance: AttendanceRecord[];
    className?: string;
}

export function AttendanceExport({ classSession, cadets, attendance, className }: AttendanceExportProps) {
    const handleDownload = () => {
        if (!classSession) return;

        // Create CSV Content
        const headers = ["Regimental No", "Rank", "Name", "Unit", "Status", "Timestamp"];

        const rows = cadets.map(cadet => {
            const record = attendance.find(
                r => r.classId === classSession.id && r.cadetId === cadet.id
            );

            const status = record?.status || "NOT MARKED";
            const timestamp = record?.timestamp ? new Date(record.timestamp).toLocaleString() : "-";

            return [
                cadet.regimentalNumber || "-",
                cadet.rank,
                cadet.name,
                cadet.unitNumber,
                status,
                timestamp
            ].map(cell => `"${cell}"`).join(","); // Quote fields to handle commas
        });

        const csvContent = [headers.join(","), ...rows].join("\n");

        // Create Blob and Download Link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_${classSession.title}_${classSession.date}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button
            onClick={handleDownload}
            variant="outline"
            className={`flex items-center gap-2 border-accent-gold/50 text-amber-700 hover:bg-accent-gold/10 hover:border-accent-gold hover:text-amber-800 transition-all ${className}`}
            disabled={!classSession}
        >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
        </Button>
    );
}
