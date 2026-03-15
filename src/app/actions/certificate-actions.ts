"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

type ActionResult = { success: boolean; error?: string };

export async function deleteCertificateAction(
    certificateId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Owner can delete their own; ANO can delete anyone's
    if (session.role !== Role.ANO) {
        const { data: cert } = await supabaseAdmin
            .from("certificates")
            .select("user_id")
            .eq("id", certificateId)
            .single();
        if (!cert || cert.user_id !== session.userId)
            return {
                success: false,
                error: "Forbidden: you can only delete your own certificates.",
            };
    }

    try {
        const { error } = await supabaseAdmin
            .from("certificates")
            .delete()
            .eq("id", certificateId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
