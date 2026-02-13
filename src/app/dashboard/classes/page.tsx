"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, Clock, MapPin, Users, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ClassesPage() {
    const { classes, addClass, deleteClass } = useData();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        time: "",
        description: "",
    });

    const canEdit = user && [Role.ANO, Role.SUO, Role.UO].includes(user.role);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const newClass = {
            id: `cls-${Date.now()}`,
            title: formData.title,
            date: formData.date,
            time: formData.time,
            instructorId: user.id,
            attendees: [],
            description: formData.description
        };

        addClass(newClass);
        setIsModalOpen(false);
        setFormData({ title: "", date: "", time: "", description: "" });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Training Schedule</h2>
                    <p className="text-gray-500 mt-1">Manage drill sessions and theory classes.</p>
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
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-400 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                        <Calendar className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No classes scheduled</p>
                    </div>
                ) : (
                    classes.map((cls, index) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary group">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                                                TRAINING
                                            </span>
                                            <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{cls.title}</CardTitle>
                                        </div>
                                        {canEdit && (
                                            <button
                                                onClick={() => deleteClass(cls.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2 text-secondary" />
                                        {cls.date}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-2 text-secondary" />
                                        {cls.time}
                                    </div>
                                    {cls.description && (
                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cls.description}</p>
                                    )}
                                </CardContent>
                                <CardFooter className="bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Users className="w-4 h-4 mr-2" />
                                        {cls.attendees.length} Cadets
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-white">
                                        View Details
                                    </Button>
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
                        <label className="text-sm font-medium text-primary/80 ml-1">Description</label>
                        <textarea
                            className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all min-h-[100px]"
                            placeholder="Brief description of the session..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Schedule Class</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
