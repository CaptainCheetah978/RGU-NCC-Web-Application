"use client";

import { FormEvent } from "react";
import { Cadet, Role } from "@/types";
import { getWingAwareRank } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditCadetModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: Partial<Cadet>;
    onChange: (updates: Partial<Cadet>) => void;
    onSubmit: (e: FormEvent) => void;
    isLoading: boolean;
}

export function EditCadetModal({ isOpen, onClose, formData, onChange, onSubmit, isLoading }: EditCadetModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Cadet Profile">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        id="edit-name"
                        value={formData.name || ""}
                        onChange={(e) => onChange({ name: e.target.value })}
                    />
                    <Input
                        label="Regimental Number"
                        id="edit-regimental"
                        value={formData.regimentalNumber || ""}
                        onChange={(e) => onChange({ regimentalNumber: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="edit-rank" className="text-sm font-medium text-gray-700 dark:text-slate-300">Rank</label>
                        <select
                            id="edit-rank"
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.role || Role.CADET}
                            onChange={(e) => onChange({ role: e.target.value as Role })}
                        >
                            {Object.values(Role)
                                .filter(r => r !== Role.ANO && r !== Role.CTO)
                                .map(r => (
                                <option key={r} value={r}>{getWingAwareRank(r, formData.wing)}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Blood Group"
                        id="edit-blood-group"
                        value={formData.bloodGroup || ""}
                        onChange={(e) => onChange({ bloodGroup: e.target.value })}
                    />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-600/60">
                    <Input
                        label="Unit Name"
                        value={formData.unitName || ""}
                        onChange={(e) => onChange({ unitName: e.target.value })}
                        className="bg-white mb-3"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Unit No"
                            value={formData.unitNumber || ""}
                            onChange={(e) => onChange({ unitNumber: e.target.value })}
                            className="bg-white"
                        />
                        <Input
                            label="Year"
                            value={formData.enrollmentYear || ""}
                            onChange={(e) => onChange({ enrollmentYear: parseInt(e.target.value) })}
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
                            value={formData.status || "active"}
                            onChange={(e) => onChange({ status: e.target.value as "active" | "alumni" })}
                        >
                            <option value="active">Active</option>
                            <option value="alumni">Alumni</option>
                        </select>
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}
