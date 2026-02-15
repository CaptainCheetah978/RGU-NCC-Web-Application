"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Role, Announcement } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { announcements, addAnnouncement, deleteAnnouncement, logActivity } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<Announcement["priority"]>("normal");

    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const canPost = [Role.ANO, Role.SUO].includes(user.role);

    const sortedAnnouncements = [...announcements].sort((a, b) => {
        if (a.priority === "urgent" && b.priority !== "urgent") return -1;
        if (b.priority === "urgent" && a.priority !== "urgent") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handlePost = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsLoading(true);

        const announcement: Announcement = {
            id: `ann-${Date.now()}`,
            title: title.trim(),
            content: content.trim(),
            authorId: user.id,
            authorName: user.name,
            priority,
            createdAt: new Date().toISOString(),
        };

        try {
            await addAnnouncement(announcement);
            if (logActivity) logActivity("Posted announcement", user.id, user.name, title.trim());
            setIsModalOpen(false);
            setTitle("");
            setContent("");
            setPriority("normal");
        } catch (error) {
            console.error("Failed to post announcement", error);
            alert("Failed to post announcement.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (ann: Announcement) => {
        if (confirm(`Delete announcement "${ann.title}"?`)) {
            try {
                await deleteAnnouncement(ann.id);
                if (logActivity) logActivity("Deleted announcement", user.id, user.name, ann.title);
            } catch (error) {
                console.error("Failed to delete announcement", error);
                alert("Failed to delete announcement.");
            }
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Announcements</h2>
                    <p className="text-gray-500 mt-1">Important notices and updates for all cadets.</p>
                </div>
                {canPost && (
                    <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/25">
                        <Plus className="w-5 h-5 mr-2" />
                        New Announcement
                    </Button>
                )}
            </div>

            {sortedAnnouncements.length === 0 ? (
                <Card className="border-gray-100">
                    <CardContent className="py-16 text-center">
                        <Megaphone className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-medium">No announcements posted yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sortedAnnouncements.map((ann, i) => (
                        <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Card className={`transition-all hover:shadow-md ${ann.priority === "urgent"
                                ? "border-red-200 bg-red-50/50 shadow-sm shadow-red-100"
                                : "border-gray-100"
                                }`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            {ann.priority === "urgent" ? (
                                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Megaphone className="w-5 h-5 text-primary" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                                                    {ann.priority === "urgent" && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                                                            URGENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 mt-2 text-sm leading-relaxed whitespace-pre-line">
                                                    {ann.content}
                                                </p>
                                                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
                                                    <span className="font-bold">By {ann.authorName}</span>
                                                    <span className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {timeAgo(ann.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {canPost && (
                                            <button
                                                onClick={() => handleDelete(ann)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* New Announcement Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Post Announcement">
                <div className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="e.g. Annual Training Camp 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Content</label>
                        <textarea
                            placeholder="Announcement details..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Priority</label>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${priority === "normal"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                                    }`}
                                onClick={() => setPriority("normal")}
                            >
                                Normal
                            </button>
                            <button
                                type="button"
                                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${priority === "urgent"
                                    ? "border-red-500 bg-red-50 text-red-600"
                                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                                    }`}
                                onClick={() => setPriority("urgent")}
                            >
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Urgent
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handlePost} isLoading={isLoading} disabled={isLoading}>Post Announcement</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
