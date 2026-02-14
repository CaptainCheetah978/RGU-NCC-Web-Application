"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Search, Shield, UserPlus, Filter, Trash2, Camera, Info } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";

export default function CadetsPage() {
    const { cadets, addCadet, updateCadet, deleteCadet, updateUser } = useData();
    const { user } = useAuth();

    if (!user) return null;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingCadet, setEditingCadet] = useState<any>(null);
    const [viewingCadet, setViewingCadet] = useState<any>(null);
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [filterRole, setFilterRole] = useState<string>("ALL");

    const canEdit = user && [Role.ANO, Role.SUO].includes(user.role);

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name} from the registry?`)) {
            deleteCadet(id);
        }
    };

    const handleEdit = (cadet: any) => {
        setEditingCadet(cadet);
        setEditFormData({
            name: cadet.name,
            regimentalNumber: cadet.regimentalNumber || "",
            rank: cadet.role,
            wing: cadet.wing,
            gender: cadet.gender,
            unitNumber: cadet.unitNumber,
            unitName: cadet.unitName || (cadet.wing === Wing.ARMY ? "Assam BN NCC" : cadet.wing === Wing.AIR ? "Assam Air Sqn NCC" : "Assam Naval Unit NCC"),
            enrollmentYear: cadet.enrollmentYear,
            bloodGroup: cadet.bloodGroup || "O+",
            groupHQ: cadet.groupHQ || "Guwahati",
            dte: cadet.dte || "North-Eastern Region (NER)",
            pin: cadet.pin || "",
        });
        setIsEditModalOpen(true);
    };

    const handleView = (cadet: any) => {
        setViewingCadet(cadet);
        setIsViewModalOpen(true);
    };

    const handlePhotoUploadClick = () => {
        setIsDisclaimerOpen(true);
    };

    const handleDisclaimerConfirm = () => {
        setIsDisclaimerOpen(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !viewingCadet) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Use updateUser for unified registry/extra persistence
            updateUser(viewingCadet.id, { avatarUrl: base64 });
            // Update local viewing state to show immediate result
            setViewingCadet((prev: any) => ({ ...prev, avatarUrl: base64 }));
        };
        reader.readAsDataURL(file);
    };

    // Helper function to format unit name for display
    const getFormattedUnit = (wing: Wing, unitNumber: string, unitName?: string): string => {
        const name = unitName || (wing === Wing.ARMY ? "Assam BN NCC" : wing === Wing.AIR ? "Assam Air Sqn NCC" : "Assam Naval Unit NCC");
        return `${unitNumber} ${name}`;
    };

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
        groupHQ: "Guwahati",
        dte: "North-Eastern Region (NER)",
        pin: "",
    });

    const [editFormData, setEditFormData] = useState({
        name: "",
        regimentalNumber: "",
        rank: Role.CADET,
        wing: Wing.ARMY,
        gender: Gender.MALE,
        unitNumber: "30",
        unitName: "Assam BN NCC",
        enrollmentYear: new Date().getFullYear(),
        bloodGroup: "O+",
        groupHQ: "Guwahati",
        dte: "North-Eastern Region (NER)",
        pin: "",
    });

    const filteredCadets = useMemo(() => {
        return cadets.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === "ALL" || c.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [cadets, searchQuery, filterRole]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCadet = {
            id: `cdt-${Date.now()}`,
            name: formData.name,
            role: formData.rank,
            rank: formData.rank,
            regimentalNumber: formData.regimentalNumber,
            wing: formData.wing,
            gender: formData.gender,
            unitNumber: formData.unitNumber,
            unitName: formData.unitName,
            enrollmentYear: formData.enrollmentYear,
            bloodGroup: formData.bloodGroup,
            groupHQ: formData.groupHQ,
            dte: formData.dte,
            pin: formData.pin,
            avatarUrl: "" // Placeholder
        };

        addCadet(newCadet);
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
            groupHQ: "Guwahati",
            dte: "North-Eastern Region (NER)",
            pin: "",
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCadet) return;

        updateCadet(editingCadet.id, {
            name: editFormData.name,
            role: editFormData.rank,
            rank: editFormData.rank,
            regimentalNumber: editFormData.regimentalNumber,
            wing: editFormData.wing,
            gender: editFormData.gender,
            unitNumber: editFormData.unitNumber,
            unitName: editFormData.unitName,
            enrollmentYear: editFormData.enrollmentYear,
            bloodGroup: editFormData.bloodGroup,
            groupHQ: editFormData.groupHQ,
            dte: editFormData.dte,
            pin: editFormData.pin,
        });

        setIsEditModalOpen(false);
        setEditingCadet(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Cadet Registry</h2>
                    <p className="text-gray-500 mt-1">Manage unit strength and profiles.</p>
                </div>
                {canEdit && (
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/25">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Enrol New Cadet
                    </Button>
                )}
            </div>

            <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
                        {["ALL", Role.SUO, Role.UO, Role.SGT, Role.CADET].map((role) => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${filterRole === role
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name or reg no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-none text-sm focus:ring-2 focus:ring-primary/10 transition-shadow outline-none"
                        />
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Cadet</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Regt. No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCadets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No cadets found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCadets.map((cadet, index) => (
                                        <motion.tr
                                            key={cadet.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-sm font-bold text-white mr-3 shadow-md shadow-primary/20">
                                                        {cadet.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{cadet.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${cadet.role === Role.SUO || cadet.role === Role.UO
                                                    ? "bg-red-50 text-red-700 border-red-100"
                                                    : "bg-blue-50 text-blue-700 border-blue-100"
                                                    }`}>
                                                    {cadet.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                                {cadet.regimentalNumber || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {getFormattedUnit(cadet.wing, cadet.unitNumber, cadet.unitName)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {cadet.enrollmentYear}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(cadet)}
                                                        >
                                                            Edit
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleView(cadet)}
                                                    >
                                                        View
                                                    </Button>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDelete(cadet.id, cadet.name)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enrol New Cadet">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="e.g. Rahul Singh"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Regimental Number"
                            placeholder="e.g. AS2024SDIA0300001"
                            value={formData.regimentalNumber}
                            onChange={(e) => setFormData({ ...formData, regimentalNumber: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Rank</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.rank}
                                onChange={(e) => setFormData({ ...formData, rank: e.target.value as Role })}
                            >
                                {Object.values(Role).filter(r => r !== Role.ANO).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Gender</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                            >
                                {Object.values(Gender).map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Wing</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.wing}
                                onChange={(e) => {
                                    const wing = e.target.value as Wing;
                                    let unitName = "";
                                    if (wing === Wing.ARMY) unitName = "Assam BN NCC";
                                    else if (wing === Wing.AIR) unitName = "Assam Air Sqn NCC";
                                    else if (wing === Wing.NAVY) unitName = "Assam Naval Unit NCC";
                                    setFormData({ ...formData, wing, unitName });
                                }}
                            >
                                {Object.values(Wing).map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Unit Number"
                            placeholder="e.g. 30, 48"
                            value={formData.unitNumber}
                            onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Unit Name"
                            value={formData.unitName}
                            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                            required
                        />
                        <Input
                            label="Enrollment Year"
                            type="number"
                            value={formData.enrollmentYear}
                            onChange={(e) => setFormData({ ...formData, enrollmentYear: parseInt(e.target.value) })}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Blood Group</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                            >
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Group HQ"
                            value={formData.groupHQ}
                            onChange={(e) => setFormData({ ...formData, groupHQ: e.target.value })}
                            required
                        />
                        <Input
                            label="Directorate (Dte)"
                            value={formData.dte}
                            onChange={(e) => setFormData({ ...formData, dte: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Input
                            label="Access PIN (Required for Officers)"
                            placeholder="e.g. 1234"
                            type="password"
                            maxLength={4}
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400 ml-1">Ranks SGT and above require a 4-digit PIN for dashboard access.</p>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Complete Enrollment</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Cadet Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Cadet Details">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            placeholder="e.g. Rahul Singh"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Regimental Number"
                            placeholder="e.g. AS2024SDIA0300001"
                            value={editFormData.regimentalNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, regimentalNumber: e.target.value.toUpperCase() })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Rank</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.rank}
                                onChange={(e) => setEditFormData({ ...editFormData, rank: e.target.value as Role })}
                            >
                                {Object.values(Role).filter(r => r !== Role.ANO).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Gender</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.gender}
                                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as Gender })}
                            >
                                {Object.values(Gender).map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Wing</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.wing}
                                onChange={(e) => {
                                    const wing = e.target.value as Wing;
                                    let unitName = "";
                                    if (wing === Wing.ARMY) unitName = "Assam BN NCC";
                                    else if (wing === Wing.AIR) unitName = "Assam Air Sqn NCC";
                                    else if (wing === Wing.NAVY) unitName = "Assam Naval Unit NCC";
                                    setEditFormData({ ...editFormData, wing, unitName });
                                }}
                            >
                                {Object.values(Wing).map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Unit Number"
                            placeholder="e.g. 30, 48"
                            value={editFormData.unitNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, unitNumber: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Unit Name"
                            value={editFormData.unitName}
                            onChange={(e) => setEditFormData({ ...editFormData, unitName: e.target.value })}
                            required
                        />
                        <Input
                            label="Enrollment Year"
                            type="number"
                            value={editFormData.enrollmentYear}
                            onChange={(e) => setEditFormData({ ...editFormData, enrollmentYear: parseInt(e.target.value) })}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-primary/80 ml-1">Blood Group</label>
                            <select
                                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                value={editFormData.bloodGroup}
                                onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                            >
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Group HQ"
                            value={editFormData.groupHQ}
                            onChange={(e) => setEditFormData({ ...editFormData, groupHQ: e.target.value })}
                            required
                        />
                        <Input
                            label="Directorate (Dte)"
                            value={editFormData.dte}
                            onChange={(e) => setEditFormData({ ...editFormData, dte: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Input
                            label="Access PIN"
                            placeholder="Leave blank to keep current"
                            type="password"
                            maxLength={4}
                            value={editFormData.pin}
                            onChange={(e) => setEditFormData({ ...editFormData, pin: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* View Cadet Profile Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Cadet Profile">
                {viewingCadet && (
                    <div className="space-y-6">
                        <div className="flex items-center p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                            <div className="relative group mr-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-2xl font-bold text-white shadow-xl overflow-hidden">
                                    {viewingCadet.avatarUrl ? (
                                        <img src={viewingCadet.avatarUrl} alt={viewingCadet.name} className="w-full h-full object-cover" />
                                    ) : (
                                        viewingCadet.name.charAt(0)
                                    )}
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={handlePhotoUploadClick}
                                        className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform border-2 border-white"
                                    >
                                        <Camera className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{viewingCadet.name}</h3>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${viewingCadet.role === Role.SUO || viewingCadet.role === Role.UO
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-blue-100 text-blue-700 border-blue-200"
                                        }`}>
                                        {viewingCadet.role}
                                    </span>
                                    {'wing' in viewingCadet && (
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                            {viewingCadet.wing}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-2">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regimental Number</p>
                                <p className="text-sm font-mono text-gray-800 font-bold">{viewingCadet.regimentalNumber || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wing</p>
                                <p className="text-sm text-gray-800 font-bold uppercase">{viewingCadet.wing}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unit Information</p>
                                <p className="text-sm text-gray-800 font-bold">
                                    {getFormattedUnit(viewingCadet.wing, viewingCadet.unitNumber, viewingCadet.unitName)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrollment Year</p>
                                <p className="text-sm text-gray-800 font-bold">{viewingCadet.enrollmentYear}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Blood Group</p>
                                <p className="text-sm text-red-600 font-bold">{viewingCadet.bloodGroup || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Group HQ</p>
                                <p className="text-sm text-gray-800 font-bold">{viewingCadet.groupHQ || "Guwahati"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Directorate</p>
                                <p className="text-sm text-gray-800 font-bold">{viewingCadet.dte || "NER"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gender</p>
                                <p className="text-sm text-gray-800 font-bold capitalize">{viewingCadet.gender.toLowerCase()}</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={() => setIsViewModalOpen(false)}>Close Review</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {/* Uniform Disclaimer Modal */}
            <Modal
                isOpen={isDisclaimerOpen}
                onClose={() => setIsDisclaimerOpen(false)}
                title="Photo Upload Disclaimer"
            >
                <div className="space-y-4">
                    <div className="flex items-start p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white mr-4 shrink-0 shadow-lg">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900">Official Requirement</h4>
                            <p className="text-sm text-amber-800/80 mt-1">
                                Photo must be in **NCC khakhi uniform** without headgear.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsDisclaimerOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-primary text-white"
                            onClick={handleDisclaimerConfirm}
                        >
                            Confirm & Proceed
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
