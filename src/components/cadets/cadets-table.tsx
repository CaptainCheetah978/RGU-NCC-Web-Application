"use client";

import { RefObject, useRef } from "react";
import { Cadet } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useVirtualizer } from "@tanstack/react-virtual";

interface CadetsTableProps {
    cadets: Cadet[];
    canEdit: boolean;
    isANO: boolean;
    onView: (cadet: Cadet) => void;
    onEdit: (cadet: Cadet) => void;
    onDelete: (cadet: Cadet) => void;
}

export function CadetsTable({ cadets, canEdit, isANO, onView, onEdit, onDelete }: CadetsTableProps) {
    const parentRef = useRef<HTMLTableSectionElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const listVirtualizer = useVirtualizer({
        count: cadets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 88,
        overscan: 5,
    });

    return (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-gray-50/50 dark:bg-slate-900/30 sticky top-0 z-10 w-full">
                    <tr className="flex w-full">
                        <th className="p-4 text-xs font-black text-zinc-800 dark:text-slate-300 uppercase tracking-wider w-1/4">Cadet</th>
                        <th className="p-4 text-xs font-black text-zinc-800 dark:text-slate-300 uppercase tracking-wider w-1/4">Rank &amp; Regt. #</th>
                        <th className="p-4 text-xs font-black text-zinc-800 dark:text-slate-300 uppercase tracking-wider w-1/4">Unit</th>
                        <th className="p-4 text-xs font-black text-zinc-800 dark:text-slate-300 uppercase tracking-wider w-[15%]">Year</th>
                        <th className="p-4 text-right text-xs font-black text-zinc-800 dark:text-slate-300 uppercase tracking-wider w-[10%]">Actions</th>
                    </tr>
                </thead>
                <tbody
                    ref={parentRef as unknown as RefObject<HTMLTableSectionElement>}
                    className="block relative h-[600px] overflow-auto divide-y divide-gray-100 dark:divide-slate-700/60"
                >
                    <div style={{ height: `${listVirtualizer.getTotalSize()}px`, width: "100%" }}>
                        {listVirtualizer.getVirtualItems().map((virtualRow) => {
                            const cadet = cadets[virtualRow.index];
                            return (
                                <tr
                                    key={cadet.id}
                                    className="flex w-full hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors group absolute top-0 left-0"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <td className="p-3 w-1/4 flex items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-zinc-500 dark:text-slate-400 overflow-hidden shrink-0">
                                                {cadet.avatarUrl ? <Image src={cadet.avatarUrl} alt="" width={40} height={40} /> : cadet.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                                    <span className="truncate">{cadet.name}</span>
                                                    {cadet.status === "alumni" && (
                                                        <span className="text-[9px] uppercase font-black tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200 dark:ring-amber-800 shrink-0">
                                                            Alumni
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 w-1/4 flex flex-col justify-center truncate">
                                        <div className="flex flex-col truncate">
                                            <span className="font-bold text-gray-900 dark:text-slate-200">{cadet.rank}</span>
                                            <span className="text-xs text-zinc-800 dark:text-slate-300 font-bold underline decoration-primary/10 truncate">
                                                {cadet.regimentalNumber}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 w-1/4 text-sm text-gray-800 dark:text-slate-300 font-medium flex items-center truncate">
                                        <span className="truncate">
                                            {cadet.unitNumber} {cadet.unitName}
                                        </span>
                                    </td>
                                    <td className="p-3 w-[15%] text-sm text-gray-800 dark:text-slate-300 font-bold flex items-center">
                                        {cadet.enrollmentYear}
                                    </td>
                                    <td className="p-3 w-[10%] text-right flex items-center justify-end">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(cadet)} aria-label={`View ${cadet.name}`}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {canEdit && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => onEdit(cadet)} aria-label={`Edit ${cadet.name}`}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {isANO && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => onDelete(cadet)} aria-label={`Delete ${cadet.name}`}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </div>
                </tbody>
            </table>
        </div>
    );
}
