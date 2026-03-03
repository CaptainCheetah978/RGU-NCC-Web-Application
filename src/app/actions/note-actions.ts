"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { NoteIdSchema } from "@/lib/schemas";

export async function deleteNoteAction(noteId: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
    // ── Auth: caller must be logged in ──────────────────────────────────────────
    const session = await getCallerSession(accessToken);
    if (!session) {
        return { success: false, error: "Unauthorized: you must be logged in." };
    }

    // ── Validate: noteId must be a valid UUID ───────────────────────────────────
    const parsed = NoteIdSchema.safeParse({ noteId });
    if (!parsed.success) {
        return { success: false, error: "Invalid note ID." };
    }

    try {
        // Verify the caller owns this note (sender or recipient) before deleting
        const { data: note, error: fetchError } = await supabaseAdmin
            .from("notes")
            .select("sender_id, recipient_id")
            .eq("id", parsed.data.noteId)
            .single();

        if (fetchError || !note) {
            return { success: false, error: "Note not found." };
        }

        const isOwner =
            note.sender_id === session.userId ||
            note.recipient_id === session.userId;

        // ANO can delete any note; others can only delete notes they sent/received
        const { Role } = await import("@/types");
        if (session.role !== Role.ANO && !isOwner) {
            return { success: false, error: "Forbidden: you can only delete your own notes." };
        }

        const { error } = await supabaseAdmin
            .from("notes")
            .delete()
            .eq("id", parsed.data.noteId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}
