"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender, Cadet } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Trash2, Key, Edit2, Eye, LayoutGrid, List as ListIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { CertificatesSection } from "@/components/profile/certificates-section";
import { createCadetAccount, updateCadetPin, getCadetPin } from "@/app/actions/cadet-actions";
import { useToast } from "@/lib/toast-context";
import { getAccessToken } from "@/lib/get-access-token";
import Image from "next/image";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from "react";

// Lazy PIN loader — fetches PIN on demand via server action, never from cached client data
function PinDisplay({ cadetId }: { cadetId: string }) {
    const [pin, setPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAccessToken().then(token => {
            if (token) getCadetPin(cadetId, token).then(p => { setPin(p); setLoading(false); });
            else setLoading(false);
        });
    }, [cadetId]);

    if (loading) return <p className="text-xs text-gray-400 animate-pulse">Loading PIN...</p>;
    if (!pin) return null;

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50 flex items-center justify-between">
            <div>
                <span className="block text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Login PIN</span>
                <span className="text-xs text-amber-600 dark:text-amber-400/70">Share this with the cadet securely.</span>
            </div>
            <span className="font-mono text-xl font-bold text-amber-900 dark:text-amber-300 tracking-widest">{pin}</span>
        </div>
    );
}

export default function CadetsPage() {
    const { cadets, updateCadet, deleteCadet, logActivity, refreshData } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
    const [viewingCadet, setViewingCadet] = useState<Cadet | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [isLoading, setIsLoading] = useState(false);

    // Initial Form State
    const initialFormState = {
        name: "",
        regimentalNumber: "",
        rank: Role.CADET,
        wing: Wing.ARMY,
        gender: Gender.MALE,
        unitNumber: "30",
        unitName: "Assam BN NCC",
        enrollmentYear: new Date().getFullYear(),
        bloodGroup: "O+",
        pin: "1234",
        status: "active",
    };

    const [formData, setFormData] = useState(initialFormState);
    const [editFormData, setEditFormData] = useState<Partial<Cadet>>({});
    const [newPin, setNewPin] = useState("");

    const [filterStatus, setFilterStatus] = useState<"active" | "alumni">("active");

    // --- Logic: Auto-update Unit based on Wing ---
    // This provides smart defaults while allowing manual override
    useEffect(() => {
        if (formData.wing === Wing.ARMY) {
            setFormData(prev => ({ ...prev, unitName: "Assam Bn NCC", unitNumber: "30" }));
        } else if (formData.wing === Wing.AIR) {
            setFormData(prev => ({ ...prev, unitName: "Assam Air Sqn NCC", unitNumber: "50" }));
        } else if (formData.wing === Wing.NAVY) {
            setFormData(prev => ({ ...prev, unitName: "Assam Naval Unit NCC", unitNumber: "48" }));
        }
    }, [formData.wing]);

    const filteredCadets = useMemo(() => {
        return cadets.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.regimentalNumber && c.regimentalNumber.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesRole = filterRole === "ALL" || c.role === filterRole;
            const matchesStatus = c.status === filterStatus;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [cadets, searchQuery, filterRole, filterStatus]);

    const parentRef = useRef<HTMLDivElement>(null);

    // Grid virtualizer - assuming 3 columns on large screens, 2 on medium, 1 on small.
    // For simplicity, we'll estimate rows based on the current window width later or just use a standard list virtualization for the list view,
    // and a specialized grid virtualizer for the grid view.
    // Let's implement row virtualization for the List view first.
    const listVirtualizer = useVirtualizer({
        count: filteredCadets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 88, // Estimate height of list row
        overscan: 5,
    });

    // Grid virtualizer
    const gridVirtualizer = useVirtualizer({
        count: Math.ceil(filteredCadets.length / 3), // Estimating 3 items per row max for simplicity
        getScrollElement: () => parentRef.current,
        estimateSize: () => 320, // Estimate height of grid card
        overscan: 2,
    });

    if (!user) return null;

    const canEdit = user && [Role.ANO, Role.SUO].includes(user.role);
    const isANO = user.role === Role.ANO;

    // --- Handlers ---

    const handleEdit = (cadet: Cadet) => {
        setEditingCadet(cadet);
        setEditFormData({
            name: cadet.name,
            role: cadet.role,
            regimentalNumber: cadet.regimentalNumber,
            wing: cadet.wing,
            gender: cadet.gender,
            unitNumber: cadet.unitNumber,
            unitName: cadet.unitName,
            enrollmentYear: cadet.enrollmentYear,
            bloodGroup: cadet.bloodGroup,
            status: cadet.status,
        });
        setIsEditModalOpen(true);
    };

    const handlePinEdit = async (cadet: Cadet) => {
        setEditingCadet(cadet);
        setIsPinModalOpen(true);
        // Fetch current PIN on demand via server action
        const token = await getAccessToken();
        const pin = await getCadetPin(cadet.id, token || "");
        setNewPin(pin || "");
    };

    const handleView = (cadet: Cadet) => {
        setViewingCadet(cadet);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || formData.name.trim().length < 2) {
            showToast("Name must be at least 2 characters."); return;
        }
        if (!formData.pin || formData.pin.length < 4) {
            showToast("PIN must be at least 4 digits."); return;
        }
        if (!/^\d+$/.test(formData.pin)) {
            showToast("PIN must contain only digits."); return;
        }

        setIsLoading(true);
        const token = await getAccessToken();
        const result = await createCadetAccount(formData, token || "");

        if (result.success) {
            await refreshData();
            setIsModalOpen(false);
            setFormData(initialFormState);
            showToast(`${formData.name} enrolled successfully! PIN: ${formData.pin}`, "success");
        } else {
            showToast("Enrollment failed: " + result.error);
        }
        setIsLoading(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCadet) return;
        setIsLoading(true);
        try {
            await updateCadet(editingCadet.id, editFormData);
            await refreshData();
            setIsEditModalOpen(false);
            showToast("Cadet profile updated.", "success");
            if (logActivity) logActivity("Updated cadet profile", user.id, user.name, editingCadet.name);
        } catch (error) {
            console.error(error);
            showToast("Failed to update cadet. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCadet) return;
        if (!newPin || newPin.length < 4) { showToast("PIN must be at least 4 digits."); return; }
        if (!/^\d+$/.test(newPin)) { showToast("PIN must contain only digits."); return; }
        setIsLoading(true);

        const token = await getAccessToken();
        const result = await updateCadetPin(editingCadet.id, newPin, token || "");
        if (result.success) {
            await refreshData();
            setIsPinModalOpen(false);
            showToast("PIN updated successfully.", "success");
        } else {
            showToast("Failed to update PIN: " + result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async (cadet: Cadet) => {
        if (!confirm(`Remove ${cadet.rank} ${cadet.name}? This cannot be undone.`)) return;
        try {
            await deleteCadet(cadet.id);
            showToast(`${cadet.name} removed from registry.`, "success");
            if (logActivity) logActivity("Removed cadet", user.id, user.name, cadet.name);
        } catch (error) {
            console.error(error);
            showToast("Failed to delete cadet. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Cadet Registry</h2>
                    <p className="text-gray-700 dark:text-slate-400 mt-1 font-medium italic">Manage personnel records, promotions, and assignments.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid View"
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-200"}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            aria-label="List View"
                            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-200"}`}
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {canEdit && (
                        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/25">
                            <UserPlus className="w-5 h-5 mr-2" />
                            Enroll Cadet
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">

                {/* Status Toggle (Active / Alumni) */}
                <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterStatus("active")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === "active"
                            ? "bg-white dark:bg-slate-600 shadow-sm text-primary dark:text-blue-400"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilterStatus("alumni")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === "alumni"
                            ? "bg-white dark:bg-slate-600 shadow-sm text-amber-600 dark:text-amber-400"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                            }`}
                    >
                        Alumni
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, regimental number, or rank..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-600 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer text-sm font-medium"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        aria-label="Filter by Rank"
                    >
                        <option value="ALL">All Ranks</option>
                        <option value={Role.SUO}>SUO</option>
                        <option value={Role.UO}>UO</option>
                        <option value={Role.SGT}>SGT</option>
                        <option value={Role.CPL}>CPL</option>
                        <option value={Role.LCPL}>LCPL</option>
                        <option value={Role.CADET}>Cadet</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {filteredCadets.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-600">
                        <UserPlus className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No cadets found</h3>
                    <p className="text-gray-700 dark:text-slate-400 mt-2 max-w-md mx-auto font-medium">
                        No results match your search or filter. Try adjusting terms or enroll a new cadet to get started.
                    </p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div ref={parentRef} className="h-[800px] overflow-auto">
                            <div
                                style={{
                                    height: `${gridVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 absolute top-0 left-0 w-full">
                                    {gridVirtualizer.getVirtualItems().map((virtualRow) => {
                                        // A virtualRow represents one chunk of 3 items (or 1/2 items depending on viewport size, simplify for demo)
                                        // To implement true masonry/CSS Grid Virtualization involves window width tracking (`useWindowSize`). 
                                        // Let's use simple list virtualization as a stand-in since `@tanstack/react-virtual` natively supports simple 1D lists best out of the box.
                                        // Note: True 2D virtualization is very complex and brittle unless using fixed cell dimensions.
                                        const startIndex = virtualRow.index * 3;
                                        const rowItems = filteredCadets.slice(startIndex, startIndex + 3);

                                        return (
                                            <div
                                                key={virtualRow.index}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                                            >
                                                {rowItems.map((cadet, i) => (
                                                    <motion.div
                                                        key={cadet.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                                    >
                                                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                                                            <div className="p-6 flex-1">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="relative shrink-0">
                                                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm flex items-center justify-center">
                                                                                {cadet.avatarUrl ? (
                                                                                    <Image src={cadet.avatarUrl} alt={cadet.name} width={64} height={64} className="object-cover" />
                                                                                ) : (
                                                                                    <span className="text-xl font-bold text-gray-400 dark:text-slate-500">{cadet.name.charAt(0)}</span>
                                                                                )}
                                                                            </div>
                                                                            <span className="absolute -bottom-2 -right-2 text-lg">
                                                                                {cadet.gender === Gender.MALE ? "👮‍♂️" : "👮‍♀️"}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors text-lg flex items-center gap-2">
                                                                                {cadet.rank} {cadet.name}
                                                                                {cadet.status === 'alumni' && (
                                                                                    <span className="text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded-full ring-1 ring-amber-200 dark:ring-amber-800">Alumni</span>
                                                                                )}
                                                                            </h3>
                                                                            <p className="text-sm text-gray-700 dark:text-slate-400 font-bold decoration-primary/20 underline underline-offset-4">
                                                                                {cadet.regimentalNumber || "N/A"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2 mb-4">
                                                                    <div className="flex items-center text-sm text-gray-800 dark:text-slate-300">
                                                                        <span className="w-24 text-gray-700 dark:text-slate-400 text-xs uppercase font-black tracking-wider">Unit</span>
                                                                        <span className="font-bold truncate">{cadet.unitNumber} {cadet.unitName}</span>
                                                                    </div>
                                                                    <div className="flex items-center text-sm text-gray-800 dark:text-slate-300">
                                                                        <span className="w-24 text-gray-700 dark:text-slate-400 text-xs uppercase font-black tracking-wider">Batches</span>
                                                                        <span className="font-bold bg-primary/5 dark:bg-slate-700 px-2 py-0.5 rounded text-xs text-primary dark:text-slate-300">{cadet.enrollmentYear}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 border-t border-gray-100 dark:border-slate-700/60 pt-4 mt-2 mt-auto">
                                                                    <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleView(cadet)}>
                                                                        View Profile
                                                                    </Button>
                                                                    {canEdit && (
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(cadet)} aria-label={`Edit ${cadet.name}`}>
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                    {isANO && (
                                                                        <>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => handlePinEdit(cadet)} aria-label={`Update PIN for ${cadet.name}`}>
                                                                                <Key className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cadet)} aria-label={`Delete ${cadet.name}`}>
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // List View
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead className="bg-gray-50/50 dark:bg-slate-900/30 sticky top-0 z-10 w-full">
                                    <tr className="flex w-full">
                                        <th className="p-4 text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider w-1/4">Cadet</th>
                                        <th className="p-4 text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider w-1/4">Rank &amp; Regt. #</th>
                                        <th className="p-4 text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider w-1/4">Unit</th>
                                        <th className="p-4 text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider w-[15%]">Year</th>
                                        <th className="p-4 text-right text-xs font-black text-gray-700 dark:text-slate-400 uppercase tracking-wider w-[10%]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody
                                    ref={parentRef as any}
                                    className="block relative h-[600px] overflow-auto divide-y divide-gray-100 dark:divide-slate-700/60"
                                >
                                    <div style={{ height: `${listVirtualizer.getTotalSize()}px`, width: '100%' }}>
                                        {listVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const cadet = filteredCadets[virtualRow.index];
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
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-400 dark:text-slate-500 overflow-hidden shrink-0">
                                                                {cadet.avatarUrl ? <Image src={cadet.avatarUrl} alt="" width={40} height={40} /> : cadet.name.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col truncate">
                                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                                                    <span className="truncate">{cadet.name}</span>
                                                                    {cadet.status === 'alumni' && (
                                                                        <span className="text-[9px] uppercase font-black tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200 dark:ring-amber-800 shrink-0">Alumni</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 w-1/4 flex flex-col justify-center truncate">
                                                        <div className="flex flex-col truncate">
                                                            <span className="font-bold text-gray-900 dark:text-slate-200">{cadet.rank}</span>
                                                            <span className="text-xs text-gray-700 dark:text-slate-400 font-bold underline decoration-primary/10 truncate">{cadet.regimentalNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 w-1/4 text-sm text-gray-800 dark:text-slate-300 font-medium flex items-center truncate">
                                                        <span className="truncate">{cadet.unitNumber} {cadet.unitName}</span>
                                                    </td>
                                                    <td className="p-3 w-[15%] text-sm text-gray-800 dark:text-slate-300 font-bold flex items-center">
                                                        {cadet.enrollmentYear}
                                                    </td>
                                                    <td className="p-3 w-[10%] text-right flex items-center justify-end">
                                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleView(cadet)} className="p-1.5 text-gray-400 hover:text-primary transition-colors" aria-label={`View ${cadet.name}`}>
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {canEdit && (
                                                                <button onClick={() => handleEdit(cadet)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" aria-label={`Edit ${cadet.name}`}>
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {isANO && (
                                                                <button onClick={() => handleDelete(cadet)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" aria-label={`Delete ${cadet.name}`}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
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
                    )}
                </>
            )}

            {/* --- MODALS --- */}

            {/* Enroll Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll New Cadet">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Regimental Number"
                            placeholder="e.g. AS21SDA100001"
                            value={formData.regimentalNumber}
                            onChange={(e) => setFormData({ ...formData, regimentalNumber: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="enroll-rank" className="text-sm font-medium text-gray-700 dark:text-slate-300">Rank</label>
                            <select
                                id="enroll-rank"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.rank}
                                onChange={(e) => setFormData({ ...formData, rank: e.target.value as Role })}
                            >
                                {Object.values(Role).filter(r => r !== Role.ANO).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="enroll-status" className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
                            <select
                                id="enroll-status"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "alumni" })}
                            >
                                <option value="active">Active</option>
                                <option value="alumni">Alumni</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label htmlFor="enroll-wing" className="text-sm font-medium text-gray-700 dark:text-slate-300">Wing</label>
                            <select
                                id="enroll-wing"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.wing}
                                onChange={(e) => setFormData({ ...formData, wing: e.target.value as Wing })}
                            >
                                <option value={Wing.ARMY}>Army</option>
                                <option value={Wing.NAVY}>Navy</option>
                                <option value={Wing.AIR}>Air Force</option>
                            </select>
                        </div>
                    </div>

                    {/* Auto-filled Unit Info (Read Only/Editable) */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-600/60 grid grid-cols-2 gap-4">
                        <Input
                            label="Unit Name"
                            value={formData.unitName}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            className="bg-white"
                        />
                        <Input
                            label="Unit Number"
                            value={formData.unitNumber}
                            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                            className="bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="enroll-gender" className="text-sm font-medium text-gray-700 dark:text-slate-300">Gender</label>
                            <select
                                id="enroll-gender"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                            >
                                <option value={Gender.MALE}>Male</option>
                                <option value={Gender.FEMALE}>Female</option>
                            </select>
                        </div>
                        <Input
                            label="Year"
                            type="number"
                            value={formData.enrollmentYear}
                            onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Blood Gp."
                            value={formData.bloodGroup}
                            onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            placeholder="O+"
                        />
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/50">
                        <Input
                            label="Access PIN (4 digits)"
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                            maxLength={4}
                            required
                            className="font-mono text-lg tracking-widest text-center"
                            placeholder="XXXX"
                        />
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 text-center">
                            This PIN will be used for login. Keep it secure.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Hereby Enroll</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal - NOW FULLY FEATURED */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Cadet Profile">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            id="edit-name"
                            value={editFormData.name || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                        <Input
                            label="Regimental Number"
                            id="edit-regimental"
                            value={editFormData.regimentalNumber || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, regimentalNumber: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-rank" className="text-sm font-medium text-gray-700 dark:text-slate-300">Rank</label>
                            <select
                                id="edit-rank"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.role || Role.CADET}
                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Role })}
                            >
                                {Object.values(Role).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Blood Group"
                            id="edit-blood-group"
                            value={editFormData.bloodGroup || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-600/60">
                        <Input
                            label="Unit Name"
                            value={editFormData.unitName || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, unitName: e.target.value })}
                            className="bg-white mb-3"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Unit No"
                                value={editFormData.unitNumber || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, unitNumber: e.target.value })}
                                className="bg-white"
                            />
                            <Input
                                label="Year"
                                value={editFormData.enrollmentYear || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, enrollmentYear: parseInt(e.target.value) })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-status" className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
                            <select
                                id="edit-status"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.status || "active"}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as "active" | "alumni" })}
                            >
                                <option value="active">Active</option>
                                <option value="alumni">Alumni</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* PIN Modal */}
            <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title="Update Access PIN">
                <form onSubmit={handlePinUpdate} className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Set a new 4-digit PIN for {editingCadet?.rank} {editingCadet?.name}. They will use this to login.
                    </p>
                    <Input
                        label="New PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        maxLength={4}
                        placeholder="1234"
                        className="text-center text-2xl tracking-[0.5em] font-mono"
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Update PIN</Button>
                    </div>
                </form>
            </Modal>

            {/* View Modal - Detailed */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Cadet Profile">
                {viewingCadet && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-gray-100 dark:border-slate-700/60 relative">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-slate-500 overflow-hidden mb-3 border-4 border-white dark:border-slate-600 shadow-lg">
                                {viewingCadet.avatarUrl ? <Image src={viewingCadet.avatarUrl} alt={viewingCadet.name} width={96} height={96} className="w-full h-full object-cover" /> : viewingCadet.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 flex-wrap">
                                {viewingCadet.rank} {viewingCadet.name}
                                {viewingCadet.status === 'alumni' && (
                                    <span className="text-xs uppercase font-black tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 px-2 py-0.5 rounded-full ring-1 ring-amber-200 dark:ring-amber-800">Alumni</span>
                                )}
                            </h3>
                            <p className="text-gray-500 dark:text-slate-400 font-mono bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs mt-2">{viewingCadet.regimentalNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-700 dark:text-slate-400 uppercase font-black">Unit</span>
                                <span className="font-bold text-gray-900 dark:text-slate-200">{viewingCadet.unitNumber} {viewingCadet.unitName}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-700 dark:text-slate-400 uppercase font-black">Wing</span>
                                <span className="font-bold text-gray-900 dark:text-slate-200">{viewingCadet.wing}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-700 dark:text-slate-400 uppercase font-black">Enrolled</span>
                                <span className="font-bold text-gray-900 dark:text-slate-200">{viewingCadet.enrollmentYear}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-700 dark:text-slate-400 uppercase font-black">Blood Group</span>
                                <span className="font-bold text-gray-900 dark:text-slate-200">{viewingCadet.bloodGroup}</span>
                            </div>
                        </div>

                        {/* Certificates Section */}
                        <div className="pt-2">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Certificates</h4>
                            <CertificatesSection userId={viewingCadet.id} isReadOnly={!isANO} />
                        </div>

                        {canEdit && (
                            <PinDisplay cadetId={viewingCadet.id} />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
