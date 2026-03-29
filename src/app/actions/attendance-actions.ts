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

    let query = supabaseAdmin
        .from("attendance")
        .select("id, class_id, cadet_id, status, created_at");

    // Scope to the caller's unit so users cannot enumerate other units' attendance
    if (session.unitId) {
        query = query.eq("unit_id", session.unitId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as AttendanceRow[]) || [] };
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
                const incomingDate = new Date(parsed.data.timestamp);
                const serverDate = new Date(existing.created_at);

                if (incomingDate <= serverDate) {
                    // This is an old offline record trying to overwrite a newer online record.
                    // Silent success to prevent error toasts for stale data.
                    return { success: true };
                }
            }

            const { error } = await supabaseAdmin
                .from("attendance")
                .update({
                    status: parsed.data.status,
                    created_at: new Date().toISOString()
                })
                .eq("id", existing.id);
            if (error) return { success: false, error: error.message };
        } else {
            const { error } = await supabaseAdmin.from("attendance").insert({
                class_id: parsed.data.classId,
                cadet_id: parsed.data.cadetId,
                status: parsed.data.status,
                marked_by: session.userId,
                unit_id: session.unitId,
            });
            if (error) return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
