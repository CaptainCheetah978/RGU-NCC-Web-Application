"use client";

import { useMemo, useState } from "react";
import { Cadet } from "@/types";

export function useCadetFilter(cadets: Cadet[]) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [filterStatus, setFilterStatus] = useState<"active" | "alumni">("active");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredCadets = useMemo(() => {
        return cadets.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.regimentalNumber && c.regimentalNumber.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesRole = filterRole === "ALL" || c.role === filterRole;
            const matchesStatus = c.status === filterStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [cadets, filterRole, filterStatus, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        filterRole,
        setFilterRole,
        filterStatus,
        setFilterStatus,
        viewMode,
        setViewMode,
        filteredCadets,
        resetFilters: () => {
            setSearchQuery("");
            setFilterRole("ALL");
            setFilterStatus("active");
        }
    };
}
