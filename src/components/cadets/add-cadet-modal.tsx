"use client";

import { FormEvent } from "react";
import { Gender, Role, Wing } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CadetFormState {
    name: string;
    regimentalNumber: string;
    rank: Role;
    wing: Wing;
    gender: Gender;
    unitNumber: string;
    unitName: string;
    enrollmentYear: number;
    bloodGroup: string;
    pin: string;
    status: "active" | "alumni";
}

interface AddCadetModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: CadetFormState;
    onChange: (updates: Partial<CadetFormState>) => void;
    onSubmit: (e: FormEvent) => void;
    isLoading: boolean;
}

export function AddCadetModal({ isOpen, onClose, formData, onChange, onSubmit, isLoading }: AddCadetModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enroll New Cadet">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        required
                    />
                    <Input
                        label="Regimental Number"
                        placeholder="e.g. AS21SDA100001"
                        value={formData.regimentalNumber}
                        onChange={(e) => onChange({ regimentalNumber: e.target.value })}
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
                            onChange={(e) => onChange({ rank: e.target.value as Role })}
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
                            onChange={(e) => onChange({ status: e.target.value as "active" | "alumni" })}
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
                            onChange={(e) => onChange({ wing: e.target.value as Wing })}
                        >
                            <option value={Wing.ARMY}>Army</option>
                            <option value={Wing.NAVY}>Navy</option>
                            <option value={Wing.AIR}>Air Force</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-600/60 grid grid-cols-2 gap-4">
                    <Input
                        label="Unit Name"
                        value={formData.unitName}
                        onChange={(e) => onChange({ unitName: e.target.value })}
                        className="bg-white"
                    />
                    <Input
                        label="Unit Number"
                        value={formData.unitNumber}
                        onChange={(e) => onChange({ unitNumber: e.target.value })}
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
                            onChange={(e) => onChange({ gender: e.target.value as Gender })}
                        >
                            <option value={Gender.MALE}>Male</option>
                            <option value={Gender.FEMALE}>Female</option>
                        </select>
                    </div>
                    <Input
                        label="Year"
                        type="number"
                        value={formData.enrollmentYear}
                        onChange={(e) => onChange({ enrollmentYear: parseInt(e.target.value) })}
                    />
                    <Input
                        label="Blood Gp."
                        value={formData.bloodGroup}
                        onChange={(e) => onChange({ bloodGroup: e.target.value })}
                        placeholder="O+"
                    />
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/50">
                    <Input
                        label="Access PIN (4 digits)"
                        value={formData.pin}
                        onChange={(e) => onChange({ pin: e.target.value })}
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
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading}>Hereby Enroll</Button>
                </div>
            </form>
        </Modal>
    );
}
