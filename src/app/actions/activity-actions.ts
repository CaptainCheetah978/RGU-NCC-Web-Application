"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Permissions } from "@/lib/permissions";

const ACTIVITY_COLUMNS = "id, action, performed_by, performed_by_name, target_name, created_at";

export async function getActivityLogAction(accessToken: string) {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized.", data: [] };
    if (!Permissions.CAN_VIEW_ACTIVITY_LOG.has(session.role)) {
        return { success: true, data: [] };
    }

    let query = supabaseAdmin
        .from("activity_log")
        .select(ACTIVITY_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(100);

    if (session.unitId) query = query.eq("unit_id", session.unitId);
    const { data, error } = await query;
    if (error) {
        if (session.unitId && (error.message?.includes("unit_id") || error.code === "42703")) {
            return { success: false, error: "Unit isolation is not available until the database migration is applied.", data: [] };
        }
        return { success: false, error: error.message, data: [] };
    }
    return { success: true, data: data || [] };
}

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
