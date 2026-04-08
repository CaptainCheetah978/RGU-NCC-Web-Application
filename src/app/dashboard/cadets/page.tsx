"use client";

import { useCadetData } from "@/lib/cadet-context";
import { useActivityData } from "@/lib/activity-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender, Cadet } from "@/types";
import { Permissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Trash2, Key, Edit2, LayoutGrid, List as ListIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn, getWingAwareRank } from "@/lib/utils";

import { CertificatesSection } from "@/components/profile/certificates-section";
import { createCadetAccount, updateCadetPin } from "@/app/actions/cadet-actions";
import { useToast } from "@/lib/toast-context";
import { getAccessToken } from "@/lib/get-access-token";
import Image from "next/image";
import { AddCadetModal, CadetFormState } from "@/components/cadets/add-cadet-modal";
import { EditCadetModal } from "@/components/cadets/edit-cadet-modal";
import { CadetsTable } from "@/components/cadets/cadets-table";
import { useCadetFilter } from "@/components/cadets/use-cadet-filter";
import { Modal } from "@/components/ui/modal";
import { RegistrySkeleton } from "@/components/cadets/registry-skeleton";

export default function CadetsPage() {
    const { cadets, updateCadet, deleteCadet, refreshProfiles, isLoading: isDataLoading } = useCadetData();
    const { logActivity } = useActivityData();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
    const [viewingCadet, setViewingCadet] = useState<Cadet | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    // Initial Form State
    const initialFormState: CadetFormState = {
        name: "",
        regimentalNumber: "",
        rank: Role.CADET,
        wing: Wing.ARMY,
        gender: Gender.SD,
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

    const {
        searchQuery,
        setSearchQuery,
        filterRole,
        setFilterRole,
        filterStatus,
        setFilterStatus,
        viewMode,
        setViewMode,
        filteredCadets,
    } = useCadetFilter(cadets);

    // --- Logic: Auto-update Unit based on Wing ---
    useEffect(() => {
        if (formData.wing === Wing.ARMY) {
            setFormData(prev => ({ ...prev, unitName: "Assam Bn NCC", unitNumber: "30" }));
        } else if (formData.wing === Wing.AIR) {
            setFormData(prev => ({ ...prev, unitName: "Assam Air Sqn NCC", unitNumber: "50" }));
        } else if (formData.wing === Wing.NAVY) {
            setFormData(prev => ({ ...prev, unitName: "Assam Naval Unit NCC", unitNumber: "48" }));
        }
    }, [formData.wing]);

    if (isAuthLoading || (isDataLoading && cadets.length === 0)) {
        return <RegistrySkeleton />;
    }

    if (!user) return null;

    const canEdit = user && Permissions.CAN_MANAGE_USERS.has(user.role);
    const isANO = user.role === Role.ANO;

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
        setNewPin("");
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
            await refreshProfiles();
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
            await refreshProfiles();
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
            await refreshProfiles();
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
                    <p className="text-zinc-800 dark:text-slate-400 mt-1 font-bold italic">Manage personnel records, promotions, and assignments.</p>
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
                <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterStatus("active")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === "active"
                            ? "bg-white dark:bg-blue-600 shadow-sm text-primary dark:text-white"
                            : "text-zinc-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilterStatus("alumni")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === "alumni"
                            ? "bg-white dark:bg-amber-600 shadow-sm text-amber-600 dark:text-white"
                            : "text-zinc-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300"
                            }`}
                    >
                        Alumni
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 pointer-events-none" />
                    <Input
                        placeholder="Search by name, regimental number, or rank..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-xl outline-none cursor-pointer text-sm font-medium"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="ALL">All Ranks</option>
                        <option value={Role.CSUO}>CSUO / SCC / SUO</option>
                        <option value={Role.CJUO}>CJUO / CUO / CC</option>
                        <option value={Role.CWO}>CWO</option>
                        <option value={Role.CSM}>CSM / CPO</option>
                        <option value={Role.CQMS}>CQMS / CPO</option>
                        <option value={Role.SGT}>SGT / PO</option>
                        <option value={Role.CPL}>CPL / LEADING</option>
                        <option value={Role.LCPL}>LCPL / ABLE</option>
                        <option value={Role.CADET}>Cadet / AB</option>
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
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="max-h-[800px] overflow-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCadets.map((cadet, i) => (
                                    <motion.div
                                        key={cadet.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                    >
                                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden hover:shadow-xl transition-all h-full flex flex-col relative group">
                                            <div className={cn(
                                                    "absolute top-0 left-0 right-0 h-1",
                                                    cadet.wing === Wing.ARMY ? "bg-emerald-600" : 
                                                    cadet.wing === Wing.NAVY ? "bg-[#002147]" : 
                                                    "bg-sky-400"
                                                )} />
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="relative shrink-0">
                                                            <div className={cn(
                                                                    "w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 overflow-hidden border-2 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105",
                                                                    cadet.wing === Wing.ARMY ? "border-emerald-500/20" : 
                                                                    cadet.wing === Wing.NAVY ? "border-[#002147]/20" : 
                                                                    "border-sky-400/20"
                                                                )}>
                                                                {cadet.avatarUrl ? <Image src={cadet.avatarUrl} alt={cadet.name} width={64} height={64} className="object-cover" /> : <span className="text-xl font-bold text-zinc-500">{cadet.name.charAt(0)}</span>}
                                                            </div>
                                                            <span className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px] font-black shadow-sm">{cadet.gender}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-lg flex items-center gap-2">
                                                                {getWingAwareRank(cadet.rank as Role, cadet.wing)} {cadet.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-700 dark:text-slate-300 font-bold underline underline-offset-4 decoration-primary/20">{cadet.regimentalNumber || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-sm">
                                                        <span className="w-24 text-zinc-800 dark:text-slate-400 text-xs uppercase font-black">Unit</span>
                                                        <span className="font-bold">{cadet.unitNumber} {cadet.unitName}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <span className="w-24 text-zinc-800 dark:text-slate-400 text-xs uppercase font-black">Batches</span>
                                                        <span className="font-bold bg-primary/5 px-2 py-0.5 rounded text-xs text-primary">{cadet.enrollmentYear}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 border-t border-gray-100 dark:border-slate-700/60 pt-4 mt-auto">
                                                    <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleView(cadet)}>View Profile</Button>
                                                    {canEdit && <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(cadet)}><Edit2 className="w-4 h-4" /></Button>}
                                                    {isANO && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => handlePinEdit(cadet)}><Key className="w-4 h-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cadet)}><Trash2 className="w-4 h-4" /></Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <CadetsTable cadets={filteredCadets} canEdit={canEdit} isANO={isANO} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
                    )}
                </>
            )}

            <AddCadetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} formData={formData} onChange={(updates) => setFormData({ ...formData, ...updates })} onSubmit={handleSubmit} isLoading={isLoading} />
            <EditCadetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} formData={editFormData} onChange={(updates) => setEditFormData({ ...editFormData, ...updates })} onSubmit={handleUpdate} isLoading={isLoading} />
            <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title="Update Access PIN">
                <form onSubmit={handlePinUpdate} className="space-y-4">
                    <Input label="New PIN" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} placeholder="1234" className="text-center text-2xl tracking-[0.5em] font-mono" />
                    <div className="pt-4 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setIsPinModalOpen(false)}>Cancel</Button><Button type="submit" isLoading={isLoading}>Update PIN</Button></div>
                </form>
            </Modal>
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Cadet Profile">
                {viewingCadet && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-gray-100 dark:border-slate-700/60">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-3xl font-bold overflow-hidden mb-3 border-4 border-white dark:border-slate-600 shadow-lg">
                                {viewingCadet.avatarUrl ? <Image src={viewingCadet.avatarUrl} alt={viewingCadet.name} width={96} height={96} className="w-full h-full object-cover" /> : viewingCadet.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{getWingAwareRank(viewingCadet.rank as Role, viewingCadet.wing)} {viewingCadet.name}</h3>
                            <p className="text-zinc-700 dark:text-slate-300 font-mono bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs mt-2">{viewingCadet.regimentalNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"><span className="block text-xs uppercase font-black text-slate-400">Unit</span><span className="font-bold">{viewingCadet.unitNumber} {viewingCadet.unitName}</span></div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"><span className="block text-xs uppercase font-black text-slate-400">Wing</span><span className="font-bold">{viewingCadet.wing}</span></div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"><span className="block text-xs uppercase font-black text-slate-400">Enrolled</span><span className="font-bold">{viewingCadet.enrollmentYear}</span></div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"><span className="block text-xs uppercase font-black text-slate-400">Blood Group</span><span className="font-bold">{viewingCadet.bloodGroup}</span></div>
                        </div>
                        <div className="pt-2">
                             <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Certificates</h4>
                             <CertificatesSection userId={viewingCadet.id} isReadOnly={!isANO} />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
