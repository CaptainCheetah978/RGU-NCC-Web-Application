"use client";

import { useData } from "@/lib/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Share2, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SheetPage() {
    const { classes, cadets, attendance } = useData();
    const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");

    const handleExport = () => {
        // Mock export
        alert("Downloading CSV report...");
    };

    const handleShare = () => {
        // Mock share
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="space-y-6 max-w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Master Roll Sheet</h2>
                    <p className="text-gray-500 mt-1">Consolidated view of attendance records.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="h-10 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center space-x-2 text-primary font-bold">
                        <Grid className="w-5 h-5" />
                        <span>Attendance Grid</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100/50">
                            <tr>
                                <th className="px-6 py-4 font-bold border-b">Regimental No</th>
                                <th className="px-6 py-4 font-bold border-b">Rank</th>
                                <th className="px-6 py-4 font-bold border-b">Name</th>
                                {classes.slice(0, 5).map(c => (
                                    <th key={c.id} className="px-6 py-4 font-bold border-b whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span>{c.date}</span>
                                            <span className="text-[10px] text-gray-500 font-normal">{c.title.split(' ')[0]}...</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cadets.map((cadet) => (
                                <tr key={cadet.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-gray-500">{cadet.regimentalNumber}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{cadet.role}</td>
                                    <td className="px-6 py-3 text-gray-800">{cadet.name}</td>
                                    {classes.slice(0, 5).map(c => {
                                        const status = attendance.find(r => r.classId === c.id && r.cadetId === cadet.id)?.status;
                                        return (
                                            <td key={c.id} className="px-6 py-3 text-center">
                                                {status === "PRESENT" && <span className="text-green-600 font-bold">P</span>}
                                                {status === "ABSENT" && <span className="text-red-500 font-bold">A</span>}
                                                {status === "LATE" && <span className="text-yellow-600 font-bold">L</span>}
                                                {!status && <span className="text-gray-300">-</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
