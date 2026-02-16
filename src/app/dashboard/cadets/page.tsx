"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender, Cadet } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Trash2, Camera, Info, Download, Lock, Key, Edit2, Eye, LayoutGrid, List as ListIcon } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CertificatesSection } from "@/components/profile/certificates-section";
import { createCadetAccount, updateCadetPin } from "@/app/actions/cadet-actions";
import Image from "next/image";

export default function CadetsPage() {
    const { cadets, updateCadet, deleteCadet, logActivity, refreshData } = useData();
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState<string | null>(null);

    const [editingCadet, setEditingCadet] = useState<Cadet | null>(null);
    const [viewingCadet, setViewingCadet] = useState<Cadet | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
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
    });

    const [editFormData, setEditFormData] = useState<any>({});
    const [newPin, setNewPin] = useState("");

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

    const handlePinEdit = (cadet: Cadet) => {
        setEditingCadet(cadet);
        setNewPin(cadet.access_pin || "");
        setIsPinModalOpen(true);
    };

    const handleView = (cadet: Cadet) => {
        setViewingCadet(cadet);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await createCadetAccount(formData);

        if (result.success) {
            await refreshData();
            setIsModalOpen(false);
            setFormData({
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
            });
            alert(`Cadet Enrolled! Login ID: ${result.userId} (Internal). They can login with Rank_Name and PIN.`);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Cadet Registry</h2>
                    <p className="text-gray-500 mt-1">Manage personnel records and profiles.</p>
                </div>
                {canEdit && (
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/25">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Enroll Cadet
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or regimental number..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
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

            {filteredCadets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No cadets found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search or enroll a new cadet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCadets.map((cadet, i) => (
                        <motion.div
                            key={cadet.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="hover:shadow-lg transition-all duration-300 group border-gray-100 overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                                    {cadet.avatarUrl ? (
                                                        <Image
                                                            src={cadet.avatarUrl}
                                                            alt={cadet.name}
                                                            width={64}
                                                            height={64}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary font-bold text-xl">
                                                            {cadet.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm text-xs">
                                                    {cadet.gender === Gender.MALE ? '♂️' : '♀️'}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                    {cadet.rank} {cadet.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {cadet.regimentalNumber || "No Regimental #"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cadet.wing === Wing.ARMY ? "bg-green-50 text-green-700 border-green-200" :
                                                        cadet.wing === Wing.NAVY ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                            "bg-sky-50 text-sky-700 border-sky-200"
                                                        }`}>
                                                        {cadet.wing}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                                                        {cadet.unitName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 border-t border-gray-100 p-3 flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleView(cadet)}>
                                            <Eye className="w-4 h-4 mr-1" /> View
                                        </Button>
                                        {canEdit && (
                                            <>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(cadet)}>
                                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                {isANO && (
                                                    <Button variant="ghost" size="sm" onClick={() => handlePinEdit(cadet)}>
                                                        <Key className="w-4 h-4 text-amber-500" />
                                                    </Button>
                                                )}
                                                {isANO && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(cadet)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Enroll Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll New Cadet">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="Ex. John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Regimental Number"
                            placeholder="AS21SDA100001"
                            value={formData.regimentalNumber}
                            onChange={(e) => setFormData({ ...formData, regimentalNumber: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Rank</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white"
                                value={formData.rank}
                                onChange={(e) => setFormData({ ...formData, rank: e.target.value as Role })}
                            >
                                <option value={Role.CADET}>Cadet</option>
                                <option value={Role.LCPL}>Lance Corporal</option>
                                <option value={Role.CPL}>Corporal</option>
                                <option value={Role.SGT}>Sergeant</option>
                                <option value={Role.UO}>Under Officer</option>
                                <option value={Role.SUO}>Senior Under Officer</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Wing</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white"
                                value={formData.wing}
                                onChange={(e) => setFormData({ ...formData, wing: e.target.value as Wing })}
                            >
                                <option value={Wing.ARMY}>Army</option>
                                <option value={Wing.NAVY}>Navy</option>
                                <option value={Wing.AIR}>Air Force</option>
                            </select>
                        </div>
                    </div>
                    {/* Add other fields as necessary... simplified for now */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Access PIN (4 digits)"
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                            maxLength={4}
                            required
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Enroll Cadet</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal - Simplified */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Cadet Profile">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <Input
                        label="Full Name"
                        value={editFormData.name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* PIN Modal */}
            <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title="Update Access PIN">
                <form onSubmit={handlePinUpdate} className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Set a new 4-digit PIN for {editingCadet?.rank} {editingCadet?.name}. They will use this to login.
                    </p>
                    <Input
                        label="New PIN"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        maxLength={4}
                        placeholder="1234"
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsPinModalOpen(false)}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Update PIN</Button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Cadet Details">
                {viewingCadet && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                                {viewingCadet.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{viewingCadet.rank} {viewingCadet.name}</h3>
                                <p className="text-gray-500">{viewingCadet.regimentalNumber}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Unit</span>
                                <span className="font-medium">{viewingCadet.unitName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Wing</span>
                                <span className="font-medium">{viewingCadet.wing}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Enrollment Year</span>
                                <span className="font-medium">{viewingCadet.enrollmentYear}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Blood Group</span>
                                <span className="font-medium">{viewingCadet.bloodGroup}</span>
                            </div>
                        </div>
                        {isANO && (
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <span className="block text-xs font-bold text-yellow-700 uppercase">Access PIN</span>
                                <span className="font-mono text-lg font-bold text-yellow-900 tracking-widest">{viewingCadet.access_pin || "Not Set"}</span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
