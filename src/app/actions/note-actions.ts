"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function deleteNoteAction(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from("notes")
            .delete()
            .eq("id", noteId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}
