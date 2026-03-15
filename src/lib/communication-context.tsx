"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Announcement, Note } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { requireAccessToken } from "@/lib/require-access-token";
import { useCadetData } from "./cadet-context";

const NOTE_COLUMNS =
    "id, sender_id, recipient_id, subject, content, is_read, created_at, forwarded_to_ano, original_sender_id, original_sender_name";
const ANNOUNCEMENT_COLUMNS = "id, title, content, author_id, priority, created_at";

type NoteRow = {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
    forwarded_to_ano: boolean | null;
    original_sender_id: string | null;
    original_sender_name: string | null;
};

type AnnouncementRow = {
    id: string;
    title: string;
    content: string;
    author_id: string;
    priority: string | null;
    created_at: string;
};

interface CommunicationContextType {
    notes: Note[];
    announcements: Announcement[];
    sendNote: (note: Note) => Promise<void>;
    markNoteAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    forwardNoteToANO: (noteId: string, anoId: string) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    addAnnouncement: (announcement: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    refreshNotes: () => Promise<void>;
    refreshAnnouncements: () => Promise<void>;
    isLoading: boolean;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
    const { allProfiles } = useCadetData();
    const queryClient = useQueryClient();

    const notesQuery = useQuery<Note[]>({
        queryKey: ["notes", allProfiles.length],
        queryFn: async (): Promise<Note[]> => {
            const { data, error } = await supabase.from("notes").select(NOTE_COLUMNS);
            if (error) throw error;
            const rows = (data ?? []) as NoteRow[];
            const profileMap = new Map<string, string>();
            allProfiles.forEach((p) => profileMap.set(p.id, p.name));
            return (
                rows.map((n) => ({
                    id: n.id,
                    senderId: n.sender_id,
                    senderName: profileMap.get(n.sender_id) || "Unknown",
                    recipientId: n.recipient_id,
                    recipientName: profileMap.get(n.recipient_id) || "Unknown",
                    content: n.content,
                    isRead: n.is_read,
                    timestamp: n.created_at,
                    subject: n.subject || "Note",
                    forwardedToANO: n.forwarded_to_ano || false,
                    originalSenderId: n.original_sender_id || undefined,
                    originalSenderName: n.original_sender_name || undefined,
                })) || []
            );
        },
    });

    const announcementsQuery = useQuery<Announcement[]>({
        queryKey: ["announcements", allProfiles.length],
        queryFn: async (): Promise<Announcement[]> => {
            const { data, error } = await supabase.from("announcements").select(ANNOUNCEMENT_COLUMNS);
            if (error) throw error;
            const rows = (data ?? []) as AnnouncementRow[];
            const profileMap = new Map<string, string>();
            allProfiles.forEach((p) => profileMap.set(p.id, p.name));
            return (
                rows.map((a) => ({
                    id: a.id,
                    title: a.title,
                    content: a.content,
                    authorId: a.author_id,
                    authorName: profileMap.get(a.author_id) || "Unknown",
                    priority:
                        (a.priority?.toLowerCase() === "urgent" ? "urgent" : "normal") satisfies Announcement["priority"],
                    createdAt: a.created_at,
                })) || []
            );
        },
    });

    const sendNoteMutation = useMutation({
        mutationFn: async (note: Note) => {
            const { sendNoteAction } = await import("@/app/actions/note-actions");
            const token = await requireAccessToken();
            const result = await sendNoteAction(
                { recipientId: note.recipientId, subject: note.subject, content: note.content },
                token
            );
            if (!result.success) throw new Error(result.error || "Failed to send note");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const markNoteAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { markNoteAsReadAction } = await import("@/app/actions/note-actions");
            const token = await requireAccessToken();
            const result = await markNoteAsReadAction(id, token);
            if (!result.success) throw new Error(result.error || "Failed to mark note as read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const { markAllAsReadAction } = await import("@/app/actions/note-actions");
            const token = await requireAccessToken();
            const result = await markAllAsReadAction(token);
            if (!result.success) throw new Error(result.error || "Failed to mark all notes as read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { deleteNoteAction } = await import("@/app/actions/note-actions");
            const token = await requireAccessToken();
            const result = await deleteNoteAction(id, token);
            if (!result.success) throw new Error(result.error || "Failed to delete note");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const forwardNoteMutation = useMutation({
        mutationFn: async ({ noteId, anoId }: { noteId: string; anoId: string }) => {
            const { forwardNoteToANOAction } = await import("@/app/actions/note-actions");
            const token = await requireAccessToken();
            const result = await forwardNoteToANOAction(noteId, anoId, token);
            if (!result.success) throw new Error(result.error || "Failed to forward note");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const addAnnouncementMutation = useMutation({
        mutationFn: async (announcement: Announcement) => {
            const { addAnnouncementAction } = await import("@/app/actions/announcement-actions");
            const token = await requireAccessToken();
            const result = await addAnnouncementAction(
                {
                    title: announcement.title,
                    content: announcement.content,
                    priority: announcement.priority,
                },
                token
            );
            if (!result.success) throw new Error(result.error || "Failed to add announcement");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });

    const deleteAnnouncementMutation = useMutation({
        mutationFn: async (id: string) => {
            const { deleteAnnouncementAction } = await import("@/app/actions/announcement-actions");
            const token = await requireAccessToken();
            const result = await deleteAnnouncementAction(id, token);
            if (!result.success) throw new Error(result.error || "Failed to delete announcement");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
        },
    });

    const value: CommunicationContextType = useMemo(
        () => ({
            notes: notesQuery.data || [],
            announcements: announcementsQuery.data || [],
            sendNote: (note) => sendNoteMutation.mutateAsync(note),
            markNoteAsRead: (id) => markNoteAsReadMutation.mutateAsync(id),
            markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
            forwardNoteToANO: (noteId, anoId) => forwardNoteMutation.mutateAsync({ noteId, anoId }),
            deleteNote: (id) => deleteNoteMutation.mutateAsync(id),
            addAnnouncement: (announcement) => addAnnouncementMutation.mutateAsync(announcement),
            deleteAnnouncement: (id) => deleteAnnouncementMutation.mutateAsync(id),
            refreshNotes: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
            refreshAnnouncements: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
            isLoading: notesQuery.isLoading || announcementsQuery.isLoading,
        }),
        [
            notesQuery.data,
            announcementsQuery.data,
            sendNoteMutation,
            markNoteAsReadMutation,
            markAllAsReadMutation,
            forwardNoteMutation,
            deleteNoteMutation,
            addAnnouncementMutation,
            deleteAnnouncementMutation,
            queryClient,
            notesQuery.isLoading,
            announcementsQuery.isLoading,
        ]
    );

    return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>;
}

export function useCommunicationData() {
    const context = useContext(CommunicationContext);
    if (!context) throw new Error("useCommunicationData must be used within a CommunicationProvider");
    return context;
}
