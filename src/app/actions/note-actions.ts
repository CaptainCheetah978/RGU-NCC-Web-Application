"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { NoteIdSchema } from "@/lib/schemas";

type ActionResult = { success: boolean; error?: string };

type NoteRow = {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject: string;
    content: string;
    is_read: boolean;
    created_at: string;
    forwarded_to_ano: boolean | null;
    original_sender_id: string | null;
    original_sender_name: string | null;
};

// ── Send Note ────────────────────────────────────────────────────────────────

export async function sendNoteAction(
    data: { recipientId: string; subject: string; content: string },
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const insertPayload: Record<string, unknown> = {
            sender_id: session.userId,
            recipient_id: data.recipientId,
            subject: data.subject,
            content: data.content,
            is_read: false,
        };
        if (session.unitId) insertPayload.unit_id = session.unitId;

        let insertError;
        const { error } = await supabaseAdmin.from("notes").insert(insertPayload);
        insertError = error;
        if (insertError && (insertError.message?.includes("unit_id") || insertError.code === '42703')) {
            delete insertPayload.unit_id;
            const { error: retry } = await supabaseAdmin.from("notes").insert(insertPayload);
            insertError = retry;
        }
        if (insertError) return { success: false, error: insertError.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Mark Note As Read ────────────────────────────────────────────────────────

export async function markNoteAsReadAction(
    noteId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Only the recipient should be able to mark a note as read
        const { data: note, error: fetchError } = await supabaseAdmin
            .from("notes")
            .select("recipient_id")
            .eq("id", noteId)
            .single();

        if (fetchError || !note) return { success: false, error: "Note not found." };
        if (note.recipient_id !== session.userId)
            return { success: false, error: "Forbidden: you can only mark your own received notes as read." };

        const { error } = await supabaseAdmin
            .from("notes")
            .update({ is_read: true })
            .eq("id", noteId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Mark All Notes As Read ───────────────────────────────────────────────────

export async function markAllAsReadAction(
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const { error } = await supabaseAdmin
            .from("notes")
            .update({ is_read: true })
            .eq("recipient_id", session.userId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Forward Note To ANO ──────────────────────────────────────────────────────

export async function forwardNoteToANOAction(
    noteId: string,
    anoId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Fetch the original note
        const { data: originalNote, error: fetchError } = await supabaseAdmin
            .from("notes")
            .select("sender_id, recipient_id, subject, content")
            .eq("id", noteId)
            .single();

        if (fetchError || !originalNote)
            return { success: false, error: "Note not found." };

        // Verify the caller is the recipient (forwarding what they received)
        if (originalNote.recipient_id !== session.userId)
            return { success: false, error: "Forbidden: you can only forward notes sent to you." };

        // Look up the sender's name
        const { data: senderProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", originalNote.sender_id)
            .single();
        const senderName = senderProfile?.full_name ?? "Unknown";

        // Insert the forwarded copy
        const fwdPayload: Record<string, unknown> = {
            sender_id: session.userId,
            recipient_id: anoId,
            subject: `[Forwarded] ${originalNote.subject}`,
            content: `[Forwarded from ${senderName}]\n\n${originalNote.content}`,
            is_read: false,
            forwarded_to_ano: true,
            original_sender_id: originalNote.sender_id,
            original_sender_name: senderName,
        };
        if (session.unitId) fwdPayload.unit_id = session.unitId;

        let fwdError;
        const { error: insertError } = await supabaseAdmin.from("notes").insert(fwdPayload);
        fwdError = insertError;
        if (fwdError && (fwdError.message?.includes("unit_id") || fwdError.code === '42703')) {
            delete fwdPayload.unit_id;
            const { error: retry } = await supabaseAdmin.from("notes").insert(fwdPayload);
            fwdError = retry;
        }
        if (fwdError) return { success: false, error: fwdError.message };

        // Mark the original note as forwarded
        const { error: updateError } = await supabaseAdmin
            .from("notes")
            .update({ forwarded_to_ano: true })
            .eq("id", noteId);
        if (updateError) return { success: false, error: updateError.message };

        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Delete Note ──────────────────────────────────────────────────────────────

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

// ── Get Notes ──────────────────────────────────────────────────────────────

/**
 * Fetches all notes for the caller's unit.
 */
export async function getNotesAction(accessToken: string): Promise<{ success: boolean; data?: NoteRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Multi-tenancy: fetch notes for caller's unit (or all if no unit_id)
        let data, error;

        if (session.unitId) {
            const result = await supabaseAdmin
                .from("notes")
                .select("id, sender_id, recipient_id, subject, content, is_read, created_at, forwarded_to_ano, original_sender_id, original_sender_name")
                .eq("unit_id", session.unitId);
            data = result.data; error = result.error;
        }

        // Fallback: no unitId or unit_id column doesn't exist
        if (!session.unitId || (error && (error.message?.includes("unit_id") || error.code === '42703'))) {
            // In single-unit mode, non-ANOs filter by their own involvement
            const { Role } = await import("@/types");
            let query = supabaseAdmin
                .from("notes")
                .select("id, sender_id, recipient_id, subject, content, is_read, created_at, forwarded_to_ano, original_sender_id, original_sender_name");
            if (session.role !== Role.ANO) {
                query = query.or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`);
            }
            const result = await query;
            data = result.data; error = result.error;
        } else {
            // Unit-scoped, apply role filter
            const { Role } = await import("@/types");
            if (session.role !== Role.ANO && data) {
                data = data.filter(n => n.sender_id === session.userId || n.recipient_id === session.userId);
            }
        }

        if (error) return { success: false, error: error.message };
        return { success: true, data: data || [] };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
