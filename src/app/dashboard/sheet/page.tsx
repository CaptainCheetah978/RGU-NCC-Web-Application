"use client";

import { useTrainingData } from "@/lib/training-context";
import { useCadetData } from "@/lib/cadet-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download, Share2, Grid, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useToast } from "@/lib/toast-context";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SheetSkeleton } from "@/components/attendance/sheet-skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function SheetPage() {
    const { classes, attendance, isLoading: trainingLoading, error: trainingError, refreshAttendance } = useTrainingData();
    const { cadets, isLoading: cadetLoading, error: cadetError, refreshProfiles } = useCadetData();
    const { showToast } = useToast();

    const isLoading = trainingLoading || cadetLoading;
    const error = trainingError || cadetError;

    const handleRetry = () => {
        refreshAttendance();
        refreshProfiles();
    };

    // Pre-build a composite-key Map so every cell lookup (in the table and in both
    // export functions) is O(1) instead of O(attendance) per cadet+class pair.
    const attendanceMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const r of attendance) {
            map.set(`${r.classId}-${r.cadetId}`, r.status);
        }
        return map;
    }, [attendance]);

    const parentRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line
    const rowVirtualizer = useVirtualizer({
        count: cadets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 49, // Approx row height
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalHeight = rowVirtualizer.getTotalSize();

    const handleExport = () => {
        if (cadets.length === 0) {
            showToast("No data to export.");
            return;
        }

        // Build CSV header
        const headers = ["Regimental No", "Rank", "Name", ...classes.map(c => `${c.date} (${c.title})`)];
        const rows = cadets.map(cadet => {
            const statuses = classes.map(c => attendanceMap.get(`${c.id}-${cadet.id}`) || "-");
            return [cadet.regimentalNumber || "", cadet.role, cadet.name, ...statuses];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `NCC_Roll_Sheet_${new Date().toISOString().slice(0, 10)}.csv`;
        
        // iOS Safari Compatibility for CSV Blobs
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) {
            window.open(url, '_blank');
        } else {
            link.click();
        }
        
        // Revoke after a delay as the tab needs time to load the blob in iOS
        setTimeout(() => URL.revokeObjectURL(url), 5000);

        showToast("CSV downloaded successfully!", "success");
    };

    const handlePdfExport = () => {
        if (cadets.length === 0 || classes.length === 0) {
            showToast("No data to export.");
            return;
        }

        const doc = new jsPDF("landscape");

        // Add Header
        doc.setFontSize(18);
        doc.setTextColor(20, 50, 100);
        doc.text("Master Attendance Roll Sheet", 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`Total Cadets: ${cadets.length}`, 14, 34);

        // Build Table
        const headRow = ["Regimental No", "Rank", "Name", ...classes.map(c => `${c.date}\n${c.title.substring(0, 10)}...`)];
        const bodyRows = cadets.map(cadet => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const row: any[] = [cadet.regimentalNumber || "-", cadet.role, cadet.name];
            classes.forEach(c => {
                const status = attendanceMap.get(`${c.id}-${cadet.id}`);
                const statusStr = status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : status === "LATE" ? "L" : "-";

                let textColor: [number, number, number] = [100, 100, 100];
                if (statusStr === "P") textColor = [22, 163, 74];
                else if (statusStr === "A") textColor = [220, 38, 38];
                else if (statusStr === "L") textColor = [217, 119, 6];

                row.push({ content: statusStr, styles: { textColor, fontStyle: "bold", halign: 'center' } });
            });
            return row;
        });

        autoTable(doc, {
            head: [headRow],
            body: bodyRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [24, 52, 94], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { bottom: 20 },
            rowPageBreak: 'auto',
            didDrawPage: (data) => {
                // Footer: Verification Engine Watermark for IP Protection
                const str = "Official Unit Training Records | Verification Engine by NCC-CMS | Generated: " + new Date().toLocaleString();
                doc.setFontSize(8);
                doc.setTextColor(150);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            }
        });

        doc.save(`Master_Roll_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`);
        showToast("PDF downloaded successfully!", "success");
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
    };

    if (error) {
        return <ErrorState onRetry={handleRetry} />;
    }

    if (isLoading) {
        return <SheetSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Master Training Records</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Consolidated view of unit training records.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={handlePdfExport} className="bg-red-600 hover:bg-red-700 text-white">
                        <FileText className="w-4 h-4 mr-2" />
                        Export PDF
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
                <CardContent className="p-0 overflow-hidden">
                    <div
                        ref={parentRef}
                        className="overflow-auto max-h-[calc(100vh-320px)] w-full"
                    >
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="sticky top-0 z-20 text-xs text-gray-700 dark:text-slate-400 uppercase bg-gray-100/90 dark:bg-slate-800/90 backdrop-blur-sm">
                                <tr className="flex">
                                    <th className="px-6 py-4 font-bold border-b dark:border-slate-700 sticky left-0 z-30 bg-gray-100 dark:bg-slate-800 min-w-[162px] max-w-[162px]">Regimental No</th>
                                    <th className="px-6 py-4 font-bold border-b dark:border-slate-700 sticky left-[162px] z-30 bg-gray-100 dark:bg-slate-800 min-w-[100px] max-w-[100px]">Rank</th>
                                    <th className="px-6 py-4 font-bold border-b dark:border-slate-700 sticky left-[262px] z-30 bg-gray-100 dark:bg-slate-800 min-w-[200px] max-w-[200px]">Name</th>
                                    {classes.map(c => (
                                        <th key={c.id} className="px-6 py-4 font-bold border-b dark:border-slate-700 whitespace-nowrap min-w-[100px] flex-1">
                                            <div className="flex flex-col">
                                                <span>{c.date}</span>
                                                <span className="text-[10px] text-gray-500 dark:text-slate-500 font-normal">{c.title.split(' ')[0]}...</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody style={{ height: `${totalHeight}px`, position: 'relative' }}>
                                {virtualRows.map((virtualRow) => {
                                    const cadet = cadets[virtualRow.index];
                                    return (
                                        <tr
                                            key={cadet.id}
                                            className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors absolute top-0 left-0 w-full flex"
                                            style={{
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <td className="px-6 py-3 font-mono text-gray-500 dark:text-slate-400 min-w-[162px] max-w-[162px] sticky left-0 z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700">{cadet.regimentalNumber}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-white min-w-[100px] max-w-[100px] sticky left-[162px] z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700">{cadet.role}</td>
                                            <td className="px-6 py-3 text-gray-800 dark:text-slate-300 min-w-[200px] max-w-[200px] sticky left-[262px] z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700 truncate">{cadet.name}</td>
                                            {classes.map(c => {
                                                const status = attendanceMap.get(`${c.id}-${cadet.id}`);
                                                return (
                                                    <td key={c.id} className="px-6 py-3 text-center border-b dark:border-slate-700 min-w-[100px] flex-1">
                                                        {status === "PRESENT" && <span className="text-green-600 font-bold">P</span>}
                                                        {status === "ABSENT" && <span className="text-red-500 font-bold">A</span>}
                                                        {status === "LATE" && <span className="text-yellow-600 font-bold">L</span>}
                                                        {!status && <span className="text-gray-300">-</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
