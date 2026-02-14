"use client";

import { useData } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function AttendanceChart() {
    const { getAttendanceByClass } = useData();
    const data = getAttendanceByClass();

    const maxTotal = Math.max(...data.map(d => d.present + d.absent + d.late + d.excused), 1);

    return (
        <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    Attendance Analytics
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">Per-class attendance breakdown</p>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No class data yet.</p>
                        <p className="text-xs mt-1">Create classes and mark attendance to see analytics.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Legend */}
                        <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider">
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 mr-1.5" />Present</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 mr-1.5" />Absent</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1.5" />Late</span>
                            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-sm bg-gray-400 mr-1.5" />Excused</span>
                        </div>

                        {/* Bars */}
                        <div className="space-y-3">
                            {data.map((item, i) => {
                                const total = item.present + item.absent + item.late + item.excused;
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[60%]">{item.className}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">{total} records</span>
                                        </div>
                                        <div className="h-6 rounded-lg bg-gray-100 overflow-hidden flex">
                                            {item.present > 0 && (
                                                <div
                                                    className="h-full bg-green-500 transition-all duration-500 flex items-center justify-center"
                                                    style={{ width: `${(item.present / maxTotal) * 100}%` }}
                                                >
                                                    {item.present > 0 && <span className="text-[9px] font-bold text-white">{item.present}</span>}
                                                </div>
                                            )}
                                            {item.absent > 0 && (
                                                <div
                                                    className="h-full bg-red-500 transition-all duration-500 flex items-center justify-center"
                                                    style={{ width: `${(item.absent / maxTotal) * 100}%` }}
                                                >
                                                    {item.absent > 0 && <span className="text-[9px] font-bold text-white">{item.absent}</span>}
                                                </div>
                                            )}
                                            {item.late > 0 && (
                                                <div
                                                    className="h-full bg-amber-500 transition-all duration-500 flex items-center justify-center"
                                                    style={{ width: `${(item.late / maxTotal) * 100}%` }}
                                                >
                                                    {item.late > 0 && <span className="text-[9px] font-bold text-white">{item.late}</span>}
                                                </div>
                                            )}
                                            {item.excused > 0 && (
                                                <div
                                                    className="h-full bg-gray-400 transition-all duration-500 flex items-center justify-center"
                                                    style={{ width: `${(item.excused / maxTotal) * 100}%` }}
                                                >
                                                    {item.excused > 0 && <span className="text-[9px] font-bold text-white">{item.excused}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
