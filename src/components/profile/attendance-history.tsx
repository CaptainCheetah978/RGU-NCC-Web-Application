"use client";

import { useData } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const STATUS_CONFIG = {
    PRESENT: { label: "Present", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    ABSENT: { label: "Absent", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
    LATE: { label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    EXCUSED: { label: "Excused", color: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertTriangle },
};

export function AttendanceHistory({ cadetId }: { cadetId: string }) {
    const { getPersonalAttendance } = useData();
    const records = getPersonalAttendance(cadetId);

    return (
        <Card className="border-gray-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                    <CalendarCheck className="w-5 h-5 mr-2 text-primary" />
                    Attendance History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {records.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No attendance records yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-3 pr-4">Date</th>
                                    <th className="pb-3 pr-4">Class</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {records.slice(0, 15).map((record, i) => {
                                    const config = STATUS_CONFIG[record.status];
                                    const Icon = config.icon;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 pr-4 text-sm text-gray-600">
                                                {new Date(record.date).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })}
                                            </td>
                                            <td className="py-3 pr-4 text-sm font-medium text-gray-800">
                                                {record.className}
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
                                                    <Icon className="w-3 h-3 mr-1" />
                                                    {config.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {records.length > 15 && (
                            <p className="text-xs text-gray-400 mt-3 text-center">Showing latest 15 of {records.length} records</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
