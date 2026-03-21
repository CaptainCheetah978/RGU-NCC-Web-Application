"use client";

import { useTrainingData } from "@/lib/training-context";
import { useActivityData } from "@/lib/activity-context";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Clock, Users, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useToast } from "@/lib/toast-context";
import { generateUuid } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { ErrorState } from "@/components/ui/error-state";

export default function ClassesPage() {
    const { classes, addClass, deleteClass, isLoading: trainingLoading, error: trainingError, refreshClasses } = useTrainingData();
    const { logActivity } = useActivityData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [, startTransition] = useTransition();

    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        tag: "Training",
        description: "",
    });

    if (trainingError) {
        return <ErrorState onRetry={refreshClasses} />;
    }

    if (trainingLoading) {
        return <PageLoader />;
    }

    if (!user) return null;

    const canEdit = user && [Role.ANO, Role.SUO, Role.UO].includes(user.role);
    const canDelete = user && [Role.ANO, Role.SUO].includes(user.role);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);

        const newClass = {
            id: generateUuid(),
            title: formData.title,
            date: formData.date,
            time: formData.time,
            tag: formData.tag,
            instructorId: user.id,
            attendees: [],
            description: formData.description
        };

        try {
            await addClass(newClass);
            showToast(`"${formData.title}" scheduled successfully.`, "success");
            if (logActivity) logActivity("Scheduled class", user.id, user.name, formData.title);
            setIsModalOpen(false);
            setFormData({ title: "", date: "", time: "", tag: "Training", description: "" });
        } catch (error) {
            console.error("Failed to schedule class", error);
            showToast("Failed to schedule class. Please check your internet connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? All attendance for this session will also be deleted.`)) return;
        
        startTransition(async () => {
            try {
                await deleteClass(id);
                showToast(`"${title}" deleted.`, "success");
                if (logActivity) logActivity("Deleted class", user.id, user.name, title);
            } catch (error) {
                console.error("Failed to delete class", error);
                showToast("Failed to delete class. Please check your network and try again.");
            }
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Training Sessions</h2>
                    <p className="text-gray-700 dark:text-slate-400 mt-1 font-medium">Manage drill sessions and theory classes.</p>
                </div>
                {canEdit && (
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/25">
                        <Plus className="w-5 h-5 mr-2" />
                        Schedule Class
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-600 dark:text-slate-500 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
                        <Calendar className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-bold">No classes scheduled</p>
                    </div>
                ) : (
                    classes.map((cls, index) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary group h-full flex flex-col hover:border-t-secondary/80">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
                                                cls.tag === 'Drill' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' :
                                                cls.tag === 'Theory' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' :
                                                cls.tag === 'Assmt' || cls.tag === 'Assessment' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' :
                                                cls.tag === 'Camp' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' :
                                                'bg-primary/10 text-primary border-primary/20'
                                            }`}>
                                                {cls.tag?.toUpperCase() || 'TRAINING'}
                                            </span>
                                            <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{cls.title}</CardTitle>
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(cls.id, cls.title)}
                                                className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                                title="Delete Class"
                                                aria-label={`Delete Class ${cls.title}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    <div className="flex items-center text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40 p-2 rounded-lg group-hover:bg-gray-100/50 dark:group-hover:bg-slate-700/60 transition-colors">
                                        <Calendar className="w-4 h-4 mr-2 text-secondary" />
                                        <span className="font-bold underline decoration-secondary/30">{cls.date}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40 p-2 rounded-lg group-hover:bg-gray-100/50 dark:group-hover:bg-slate-700/60 transition-colors">
                                        <Clock className="w-4 h-4 mr-2 text-tertiary" />
                                        <span className="font-bold underline decoration-tertiary/30">{cls.time}</span>
                                    </div>
                                    {cls.description && (
                                        <p className="text-sm text-gray-700 dark:text-slate-400 mt-2 line-clamp-2 px-1 font-medium italic">{cls.description}</p>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-gray-50/50 dark:bg-slate-900/20 border-t border-gray-100 dark:border-slate-700/50 flex justify-between items-center p-4">
                                    <div className="flex items-center text-sm text-gray-700 dark:text-slate-400 font-bold">
                                        <Users className="w-4 h-4 mr-2 text-gray-600" />
                                        {/* Attendees count might be inaccurate if not joined, but relying on what's in classes state */}
                                        {cls.attendees?.length || 0} Cadets
                                    </div>
                                    <Link href={`/dashboard/attendance?classId=${cls.id}`}>
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-white hover:bg-primary border border-primary/20 hover:border-primary transition-all">
                                            View Attendance
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Class">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Class Title"
                        placeholder="e.g. Drill Practice"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <Input
                            label="Time"
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="class-tag" className="text-sm font-medium text-primary/80 ml-1">Session Category</label>
                        <select
                            id="class-tag"
                            className="flex h-11 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2 text-sm text-gray-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all appearance-none cursor-pointer"
                            value={formData.tag}
                            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        >
                            <option value="Training">Training</option>
                            <option value="Drill">Drill</option>
                            <option value="Theory">Theory</option>
                            <option value="Camp">Camp</option>
                            <option value="Parade">Parade</option>
                            <option value="Assessment">Assessment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="class-description" className="text-sm font-medium text-primary/80 ml-1">Description</label>
                        <textarea
                            id="class-description"
                            className="flex w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-4 py-2 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all min-h-[100px]"
                            placeholder="Brief description of the session..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading} disabled={isLoading}>Schedule Class</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
