"use client";

import { useTrainingData } from "@/lib/training-context";
import { useCadetData } from "@/lib/cadet-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, UserCheck, Shield } from "lucide-react";
import { useMemo, useState } from "react";

export default function PerformanceDashboard() {
    const { classes, attendance } = useTrainingData();
    const { cadets } = useCadetData();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    // Calculate performance per cadet
    const performanceData = useMemo(() => {
        if (!classes.length || !cadets.length) return [];

        // Only count classes that have past dates or attendance records
        const conductedClasses = classes.filter(c =>
            attendance.some(a => a.classId === c.id)
        );

        if (conductedClasses.length === 0) return [];

        return cadets.map(cadet => {
            let present = 0;
            let absent = 0;
            let late = 0;

            conductedClasses.forEach(c => {
                const record = attendance.find(a => a.classId === c.id && a.cadetId === cadet.id);
                if (record?.status === "PRESENT") present++;
                else if (record?.status === "ABSENT") absent++;
                else if (record?.status === "LATE") late++;
                // If no record, we assume absent since the class was conducted
                else absent++;
            });

            const total = conductedClasses.length;
            const percentage = Math.round((present / total) * 100);

            return {
                ...cadet,
                present,
                absent,
                late,
                total,
                percentage
            };
        }).sort((a, b) => b.percentage - a.percentage);
    }, [classes, cadets, attendance]);

    // Derived summaries — memoized so they only recompute when performanceData changes,
    // not on every keystroke or parent re-render.
    const topPerformers = useMemo(
        () => performanceData.filter(c => c.percentage >= 90).slice(0, 5),
        [performanceData]
    );
    const atRiskCadets = useMemo(
        () => [...performanceData].reverse().filter(c => c.percentage <= 50),
        [performanceData]
    );
    const avgAttendance = useMemo(
        () => Math.round(performanceData.reduce((acc, curr) => acc + curr.percentage, 0) / performanceData.length) || 0,
        [performanceData]
    );
    // Search filter — memoized so keystroke changes only re-filter, not re-sort the full list.
    const filteredData = useMemo(
        () => performanceData.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [performanceData, searchQuery]
    );

    if (!user) return null;

    if (performanceData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-140px)]">
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <TrendingUp className="w-12 h-12 text-gray-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Data Available</h3>
                <p className="text-gray-700 dark:text-slate-400 mt-2 max-w-sm text-center">Attendance data is required to calculate performance stats. Mark attendance for at least one class.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Performance Analytics</h2>
                <p className="text-gray-700 dark:text-slate-400 mt-1 font-medium italic">Track cadet attendance and unit health metrics.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 border-primary/10 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-slate-800/50 shadow-md">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Unit Average</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{avgAttendance}%</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Based on {performanceData[0]?.total} classes</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-green-200/50 bg-gradient-to-br from-white to-green-50/50 dark:from-slate-900 dark:to-green-900/10 shadow-md">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Top Performers</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{topPerformers.length}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cadets with &ge; 90% attendance</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                            <UserCheck className="w-7 h-7" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-red-200/50 bg-gradient-to-br from-white to-red-50/50 dark:from-slate-900 dark:to-red-900/10 shadow-md">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">At Risk</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{atRiskCadets.length}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cadets with &le; 50% attendance</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md border-gray-100 dark:border-slate-800">
                    <CardHeader className="bg-green-50/50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-900/50">
                        <CardTitle className="text-lg font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Top 5 Cadets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {topPerformers.length > 0 ? topPerformers.map((cadet, i) => (
                                <div key={cadet.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 flex items-center justify-center font-bold text-sm">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{cadet.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{cadet.regimentalNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-green-600 dark:text-green-400 text-lg">{cadet.percentage}%</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{cadet.present} / {cadet.total} present</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-gray-500 dark:text-slate-400">No top performers yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-gray-100 dark:border-slate-800">
                    <CardHeader className="bg-red-50/50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/50">
                        <CardTitle className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Attention Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-slate-800">
                            {atRiskCadets.length > 0 ? atRiskCadets.map((cadet) => (
                                <div key={cadet.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                                            !
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{cadet.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{cadet.regimentalNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-red-600 dark:text-red-400 text-lg">{cadet.percentage}%</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">{cadet.absent} absences</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-gray-500 dark:text-slate-400">No at-risk cadets found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Full Roster Chart/Table */}
            <Card className="shadow-md border-gray-100 dark:border-slate-800">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/20">
                    <CardTitle className="text-lg font-bold">Complete Unit Performance</CardTitle>
                    <input
                        type="text"
                        placeholder="Search cadet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
                    />
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                            <tr className="text-gray-500 dark:text-slate-400 uppercase text-xs tracking-wider font-bold">
                                <th className="px-6 py-4">Cadet</th>
                                <th className="px-6 py-4 text-center">Present</th>
                                <th className="px-6 py-4 text-center">Absent</th>
                                <th className="px-6 py-4 text-center">Late</th>
                                <th className="px-6 py-4 w-1/3">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {filteredData.map(cadet => (
                                <tr key={cadet.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{cadet.name}</div>
                                        <div className="text-xs font-mono text-gray-500">{cadet.regimentalNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-green-600">{cadet.present}</td>
                                    <td className="px-6 py-4 text-center font-medium text-red-500">{cadet.absent}</td>
                                    <td className="px-6 py-4 text-center font-medium text-amber-500">{cadet.late}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 text-right font-bold text-gray-900 dark:text-white">
                                                {cadet.percentage}%
                                            </div>
                                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${cadet.percentage >= 80 ? 'bg-green-500' :
                                                        cadet.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${cadet.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
