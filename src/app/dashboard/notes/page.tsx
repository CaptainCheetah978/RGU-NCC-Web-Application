"use client";

import { useData } from "@/lib/data-context";
import { useAuth } from "@/lib/auth-context";
import { Role, Note } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
    MessageSquare,
    Plus,
    Send,
    Inbox,
    Clock,
    Forward,
    Trash2,
    CheckCircle2,
    ArrowUpRight,
    User,
    Search
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NotesPage() {
    const {
        notes,
        sendNote,
        markNoteAsRead,
        forwardNoteToANO,
        deleteNote,
        messageableUsers
    } = useData();
    const { user } = useAuth();

    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        recipientId: "",
        subject: "",
        content: "",
    });

    if (!user) return null;

    const inboxNotes = useMemo(() => {
        return notes
            .filter(n => n.recipientId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notes, user.id]);

    const sentNotes = useMemo(() => {
        return notes
            .filter(n => n.senderId === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notes, user.id]);

    const filteredNotes = useMemo(() => {
        const baseNotes = activeTab === "inbox" ? inboxNotes : sentNotes;
        if (!searchQuery) return baseNotes;

        return baseNotes.filter(n =>
            n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeTab, inboxNotes, sentNotes, searchQuery]);

    const handleSendNote = (e: React.FormEvent) => {
        e.preventDefault();

        const recipient = messageableUsers.find(u => u.id === formData.recipientId);
        if (!recipient) return;

        const newNote: Note = {
            id: `note-${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            subject: formData.subject,
            content: formData.content,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        sendNote(newNote);
        setIsComposeModalOpen(false);
        setFormData({ recipientId: "", subject: "", content: "" });
    };

    const handleNoteClick = (note: Note) => {
        setSelectedNote(note);
        if (activeTab === "inbox" && !note.isRead) {
            markNoteAsRead(note.id);
        }
    };

    const handleForward = (note: Note) => {
        const ano = messageableUsers.find(u => u.role === Role.ANO);
        if (ano) {
            forwardNoteToANO(note.id, ano.id, ano.name);
            alert(`Note forwarded to ${ano.name}`);
        } else {
            alert("No ANO found to forward to.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Private Notes</h2>
                    <p className="text-gray-500 mt-1">Direct communication for NCC duties and requests.</p>
                </div>
                <Button onClick={() => setIsComposeModalOpen(true)} className="shadow-lg shadow-primary/25">
                    <Plus className="w-5 h-5 mr-2" />
                    New Message
                </Button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Left Sidebar: Note List */}
                <Card className="w-full md:w-80 border-white/20 shadow-sm flex flex-col overflow-hidden bg-white/80 backdrop-blur-sm">
                    <div className="p-4 border-b border-gray-100 space-y-4 shrink-0">
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            {(["inbox", "sent"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedNote(null); }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeTab === tab
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {tab === "inbox" ? <Inbox className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                    <span className="capitalize">{tab}</span>
                                    {tab === "inbox" && inboxNotes.some(n => !n.isRead) && (
                                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-none text-xs focus:ring-2 focus:ring-primary/10 transition-shadow outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No {activeTab} yet.</p>
                            </div>
                        ) : (
                            filteredNotes.map((note) => (
                                <motion.button
                                    key={note.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => handleNoteClick(note)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl transition-all border group relative",
                                        selectedNote?.id === note.id
                                            ? "bg-primary/5 border-primary/20"
                                            : "bg-transparent border-transparent hover:bg-gray-50"
                                    )}
                                >
                                    {activeTab === "inbox" && !note.isRead && (
                                        <div className="absolute top-1/2 -left-1 w-1.5 h-6 bg-primary rounded-full -translate-y-1/2" />
                                    )}

                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn(
                                            "text-xs font-bold leading-tight line-clamp-1 flex-1",
                                            activeTab === "inbox" && !note.isRead ? "text-gray-900" : "text-gray-600"
                                        )}>
                                            {activeTab === "inbox" ? note.senderName : note.recipientName}
                                        </span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                            {new Date(note.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-sm font-bold mb-1 line-clamp-1",
                                        activeTab === "inbox" && !note.isRead ? "text-primary" : "text-gray-700"
                                    )}>
                                        {note.subject}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{note.content}</p>

                                    {note.forwardedToANO && (
                                        <div className="mt-2 flex items-center text-[10px] text-primary/60 font-bold uppercase tracking-wider">
                                            <Forward className="w-3 h-3 mr-1" />
                                            Forwarded to ANO
                                        </div>
                                    )}
                                </motion.button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Right Area: Note Content */}
                <Card className="flex-1 border-white/20 shadow-sm flex flex-col overflow-hidden bg-white/50 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {selectedNote ? (
                            <motion.div
                                key={selectedNote.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1 }}
                                className="flex-1 flex flex-col min-h-0"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white/50">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase tracking-wider">
                                                {activeTab === "inbox" ? "From" : "To"}
                                            </span>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {activeTab === "inbox" ? selectedNote.senderName : selectedNote.recipientName}
                                            </h3>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {new Date(selectedNote.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {activeTab === "inbox" && user.role === Role.SUO && !selectedNote.forwardedToANO && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleForward(selectedNote)}
                                                className="text-primary hover:text-primary hover:bg-primary/5"
                                            >
                                                <Forward className="w-4 h-4 mr-2" />
                                                Forward to ANO
                                            </Button>
                                        )}
                                        <button
                                            onClick={() => { deleteNote(selectedNote.id); setSelectedNote(null); }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6 flex-1 overflow-y-auto bg-white/30">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h4 className="text-xl font-bold text-gray-900 mb-4 border-b pb-4">
                                            {selectedNote.subject}
                                        </h4>
                                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedNote.content}
                                        </div>
                                    </div>

                                    {selectedNote.forwardedToANO && (
                                        <div className="flex items-center p-4 bg-primary/5 rounded-xl border border-primary/10 text-primary">
                                            <Shield className="w-5 h-5 mr-3" />
                                            <div>
                                                <p className="text-sm font-bold">Priority Status: Advanced</p>
                                                <p className="text-xs">This note has been reported to the Associate NCC Officer.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 p-12 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-10 h-10 text-gray-200" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-600">Select a message</h4>
                                    <p className="text-sm max-w-xs mx-auto">Click on a message from the list to view its contents and take action.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>

            {/* Compose Modal */}
            <Modal isOpen={isComposeModalOpen} onClose={() => setIsComposeModalOpen(false)} title="Compose New Note">
                <form onSubmit={handleSendNote} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Recipient</label>
                        <select
                            className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            value={formData.recipientId}
                            onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                            required
                        >
                            <option value="">Select Recipient...</option>
                            {messageableUsers
                                .filter(u => (u.role === Role.ANO || u.role === Role.SUO) && u.id !== user.id)
                                .map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}{u.name !== u.role ? ` (${u.role})` : ""} {u.regimentalNumber ? ` - ${u.regimentalNumber}` : ""}
                                    </option>
                                ))}
                        </select>
                        <p className="text-[10px] text-gray-400 ml-1">You can send notes directly to the ANO or SUO.</p>
                    </div>

                    <Input
                        label="Subject"
                        placeholder="e.g. Leave Request, Drill Feedback"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-primary/80 ml-1">Message</label>
                        <textarea
                            className="flex min-h-[150px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            placeholder="Write your note here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsComposeModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="px-8 shadow-lg shadow-primary/25">
                            <Send className="w-4 h-4 mr-2" />
                            Send Note
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    )
}
