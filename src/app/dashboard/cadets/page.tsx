"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Wing, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Search, Shield, UserPlus, Filter, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export default function CadetsPage() {
    const { cadets, addCadet, updateCadet, deleteCadet } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCadet, setEditingCadet] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
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
        });
        setIsEditModalOpen(true);
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
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Regimental No</th>
                                    <th className="px-6 py-4">Unit</th>
                                    <th className="px-6 py-4">Enrolled</th>
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
                                                    <Button variant="ghost" size="sm">
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
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
