"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender, Cadet } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Trash2, Key, Edit2, Eye, LayoutGrid, List as ListIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { CertificatesSection } from "@/components/profile/certificates-section";
import { createCadetAccount, updateCadetPin, getCadetPin } from "@/app/actions/cadet-actions";
import Image from "next/image";

// Lazy PIN loader — fetches PIN on demand via server action, never from cached client data
function PinDisplay({ cadetId }: { cadetId: string }) {
    const [pin, setPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCadetPin(cadetId).then(p => { setPin(p); setLoading(false); });
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
    };

    const [formData, setFormData] = useState(initialFormState);
    const [editFormData, setEditFormData] = useState<Partial<Cadet>>({});
    const [newPin, setNewPin] = useState("");

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
            return matchesSearch && matchesRole;
        });
    }, [cadets, searchQuery, filterRole]);

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
        });
        setIsEditModalOpen(true);
    };

    const handlePinEdit = async (cadet: Cadet) => {
        setEditingCadet(cadet);
        setIsPinModalOpen(true);
        // Fetch current PIN on demand via server action
        const pin = await getCadetPin(cadet.id);
        setNewPin(pin || "");
    };

    const handleView = (cadet: Cadet) => {
        setViewingCadet(cadet);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- Form Validation ---
        if (!formData.name.trim()) { alert("Name is required."); return; }
        if (formData.name.trim().length < 2) { alert("Name must be at least 2 characters."); return; }
        if (!formData.pin || formData.pin.length < 4) { alert("PIN must be at least 4 digits."); return; }
        if (!/^\d+$/.test(formData.pin)) { alert("PIN must contain only digits."); return; }

        setIsLoading(true);

        const result = await createCadetAccount(formData);

        if (result.success) {
            await refreshData();
            setIsModalOpen(false);
            setFormData(initialFormState);
            alert(`Cadet Enrolled Successfully!\n\nRank: ${formData.rank}\nName: ${formData.name}\nPIN: ${formData.pin}`);
        } else {
            alert("Enrollment Failed: " + result.error);
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
            if (logActivity) logActivity("Updated cadet profile", user.id, user.name, editingCadet.name);
        } catch (error) {
            console.error(error);
            alert("Failed to update cadet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCadet) return;
        if (!newPin || newPin.length < 4) { alert("PIN must be at least 4 digits."); return; }
        if (!/^\d+$/.test(newPin)) { alert("PIN must contain only digits."); return; }
        setIsLoading(true);

        const result = await updateCadetPin(editingCadet.id, newPin);

        if (result.success) {
            await refreshData();
            setIsPinModalOpen(false);
            alert("PIN Updated successfully.");
        } else {
            alert("Failed to update PIN: " + result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async (cadet: Cadet) => {
        if (confirm(`Are you sure you want to remove ${cadet.rank} ${cadet.name}? This cannot be undone.`)) {
            try {
                await deleteCadet(cadet.id);
                if (logActivity) logActivity("Removed cadet", user.id, user.name, cadet.name);
            } catch (error) {
                console.error(error);
                alert("Failed to delete cadet.");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Cadet Registry</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Manage personnel records, promotions, and assignments.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-200"}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
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
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by name, regimental number, or rank..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer text-sm font-medium"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
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
                    <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                        No results match your search or filter. Try adjusting terms or enroll a new cadet to get started.
                    </p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCadets.map((cadet, i) => (
                                <motion.div
                                    key={cadet.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                >
                                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                        <div className="p-6">
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
                                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors text-lg">
                                                            {cadet.rank} {cadet.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 dark:text-slate-400 font-mono">
                                                            {cadet.regimentalNumber || "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                                                    <span className="w-24 text-gray-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">Unit</span>
                                                    <span className="font-medium truncate">{cadet.unitNumber} {cadet.unitName}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                                                    <span className="w-24 text-gray-400 dark:text-slate-500 text-xs uppercase font-bold tracking-wider">Batches</span>
                                                    <span className="font-medium bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs text-gray-700 dark:text-slate-300">{cadet.enrollmentYear}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 border-t border-gray-100 dark:border-slate-700/60 pt-4 mt-2">
                                                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => handleView(cadet)}>
                                                    View Profile
                                                </Button>
                                                {canEdit && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => handleEdit(cadet)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {isANO && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => handlePinEdit(cadet)}>
                                                            <Key className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(cadet)}>
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
                    ) : (
                        // List View
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 dark:bg-slate-900/30">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Cadet</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rank &amp; Regt. #</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Unit</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Year</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                                    {filteredCadets.map((cadet) => (
                                        <tr key={cadet.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center font-bold text-gray-400 dark:text-slate-500 overflow-hidden">
                                                        {cadet.avatarUrl ? <Image src={cadet.avatarUrl} alt="" width={40} height={40} /> : cadet.name.charAt(0)}
                                                    </div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{cadet.name}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-slate-200">{cadet.rank}</span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-mono">{cadet.regimentalNumber}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-slate-300">{cadet.unitNumber} {cadet.unitName}</td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-slate-300">{cadet.enrollmentYear}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleView(cadet)} className="p-2 text-gray-400 hover:text-primary transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {canEdit && (
                                                        <button onClick={() => handleEdit(cadet)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isANO && (
                                                        <button onClick={() => handleDelete(cadet)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Rank</label>
                            <select
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
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Wing</label>
                            <select
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
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Gender</label>
                            <select
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
                            value={editFormData.name || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                        <Input
                            label="Regimental #"
                            value={editFormData.regimentalNumber || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, regimentalNumber: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Rank</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
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
                        <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-gray-100 dark:border-slate-700/60">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-3xl font-bold text-gray-400 dark:text-slate-500 overflow-hidden mb-3 border-4 border-white dark:border-slate-600 shadow-lg">
                                {viewingCadet.avatarUrl ? <Image src={viewingCadet.avatarUrl} alt={viewingCadet.name} width={96} height={96} className="w-full h-full object-cover" /> : viewingCadet.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingCadet.rank} {viewingCadet.name}</h3>
                            <p className="text-gray-500 dark:text-slate-400 font-mono bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs mt-2">{viewingCadet.regimentalNumber}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">Unit</span>
                                <span className="font-medium text-gray-900 dark:text-slate-200">{viewingCadet.unitNumber} {viewingCadet.unitName}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">Wing</span>
                                <span className="font-medium text-gray-900 dark:text-slate-200">{viewingCadet.wing}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">Enrolled</span>
                                <span className="font-medium text-gray-900 dark:text-slate-200">{viewingCadet.enrollmentYear}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="block text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">Blood Group</span>
                                <span className="font-medium text-gray-900 dark:text-slate-200">{viewingCadet.bloodGroup}</span>
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
