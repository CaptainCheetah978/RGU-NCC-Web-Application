"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { MarkAttendanceSchema } from "@/lib/schemas";
import { Role } from "@/types";

/** Roles allowed to mark attendance */
const ATTENDANCE_ROLES: Role[] = [Role.ANO, Role.SUO, Role.UO, Role.SGT];

type ActionResult = { success: boolean; error?: string };

type AttendanceRow = {
    id: string;
    class_id: string;
    cadet_id: string;
    status: string;
    created_at: string;
};

// ── Get Attendance ────────────────────────────────────────────────────────────

export async function getAttendanceAction(
    accessToken: string
): Promise<{ success: boolean; data?: AttendanceRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        let query = supabaseAdmin
            .from("attendance")
            .select("id, class_id, cadet_id, status, created_at");

        // Scope to the caller's unit so users cannot enumerate other units' attendance
        // Multi-tenancy enforcement at the server layer
        if (session.unitId) {
            query = query.eq("unit_id", session.unitId);
        }

        const { data, error } = await query;
        if (error) {
            // If the error is about unit_id column not existing, retry without filter
            if (error.message?.includes("unit_id") || error.code === '42703') {
                console.warn("getAttendanceAction: unit_id column not found, fetching without unit filter");
                const { data: fallbackData, error: fallbackError } = await supabaseAdmin
                    .from("attendance")
                    .select("id, class_id, cadet_id, status, created_at");
                if (fallbackError) {
                    console.error("getAttendanceAction fallback error:", fallbackError);
                    return { success: false, error: fallbackError.message };
                }
                return { success: true, data: (fallbackData as AttendanceRow[]) || [] };
            }
            console.error("getAttendanceAction DB error:", error);
            return { success: false, error: error.message };
        }
        return { success: true, data: (data as AttendanceRow[]) || [] };
    } catch (e: unknown) {
        console.error("getAttendanceAction unexpected error:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

export async function markAttendanceAction(
    data: { classId: string; cadetId: string; status: string; timestamp?: string },
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!ATTENDANCE_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    const parsed = MarkAttendanceSchema.safeParse(data);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
        return { success: false, error: firstError };
    }

    try {
        // Check if attendance record already exists
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("attendance")
            .select("id, created_at")
            .eq("class_id", parsed.data.classId)
            .eq("cadet_id", parsed.data.cadetId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            return { success: false, error: fetchError.message };
        }

        if (existing) {
            // Conflict Resolution: Only update if incoming timestamp is missing (immediate online update)
            // or if it's newer than the server's last update.
            if (parsed.data.timestamp) {
                const incomingDate = new Date(parsed.data.timestamp).getTime();
                const serverDate = new Date(existing.created_at).getTime();

                if (incomingDate <= serverDate) {
                    // This is an old offline record trying to overwrite a newer online record.
                    // Silent success to prevent error toasts for stale data.
                    console.log("Stale update rejected:", { incomingDate, serverDate });
                    return { success: true };
                }
            }

            const { error } = await supabaseAdmin
                .from("attendance")
                .update({
                    status: parsed.data.status,
                    marked_by: session.userId,
                    created_at: new Date().toISOString() // Bump timestamp on every edit
                })
                .eq("id", existing.id);
            
            if (error) {
                console.error("markAttendance update error:", error);
                return { success: false, error: error.message };
            }
        } else {
            const insertPayload: Record<string, unknown> = {
                class_id: parsed.data.classId,
                cadet_id: parsed.data.cadetId,
                status: parsed.data.status,
                marked_by: session.userId,
                created_at: parsed.data.timestamp || new Date().toISOString()
            };
            // Only include unit_id if available (migration 005 applied)
            if (session.unitId) insertPayload.unit_id = session.unitId;

            let insertError;
            const { error } = await supabaseAdmin.from("attendance").insert(insertPayload);
            insertError = error;

            // If unit_id column doesn't exist, retry without it
            if (insertError && (insertError.message?.includes("unit_id") || insertError.code === '42703')) {
                console.warn("markAttendance: unit_id column not found, inserting without it");
                delete insertPayload.unit_id;
                const { error: retryError } = await supabaseAdmin.from("attendance").insert(insertPayload);
                insertError = retryError;
            }

            if (insertError) {
                console.error("markAttendance insert error:", insertError);
                return { success: false, error: insertError.message };
            }
        }

        return { success: true };
    } catch (e: unknown) {
        console.error("markAttendanceAction unexpected error:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
