"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";

export async function logActivityAction(
    data: { action: string; targetName?: string },
    accessToken: string
) {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const insertPayload: Record<string, unknown> = {
        action: data.action,
        performed_by: session.userId,
        performed_by_name: session.userName,
        target_name: data.targetName || null,
    };
    if (session.unitId) insertPayload.unit_id = session.unitId;

    let insertError;
    const { error } = await supabaseAdmin.from("activity_log").insert(insertPayload);
    insertError = error;
    if (insertError && (insertError.message?.includes("unit_id") || insertError.code === '42703')) {
        delete insertPayload.unit_id;
        const { error: retry } = await supabaseAdmin.from("activity_log").insert(insertPayload);
        insertError = retry;
    }

    if (insertError) return { success: false, error: insertError.message };
    return { success: true };
}
