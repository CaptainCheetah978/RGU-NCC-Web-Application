"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";

export async function logActivityAction(
    data: { action: string; targetName?: string },
    accessToken: string
) {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const { error } = await supabaseAdmin.from("activity_log").insert({
        action: data.action,
        performed_by: session.userId,
        performed_by_name: session.userName,
        target_name: data.targetName || null,
        unit_id: session.unitId,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
}
