"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { MarkAttendanceSchema } from "@/lib/schemas";
import { Role } from "@/types";

/** Roles allowed to mark attendance */
const ATTENDANCE_ROLES: Role[] = [Role.ANO, Role.SUO, Role.UO, Role.SGT];

type ActionResult = { success: boolean; error?: string };

export async function markAttendanceAction(
    data: { classId: string; cadetId: string; status: string },
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
            .select("id")
            .eq("class_id", parsed.data.classId)
            .eq("cadet_id", parsed.data.cadetId)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            return { success: false, error: fetchError.message };
        }

        if (existing) {
            const { error } = await supabaseAdmin
                .from("attendance")
                .update({ status: parsed.data.status })
                .eq("id", existing.id);
            if (error) return { success: false, error: error.message };
        } else {
            const { error } = await supabaseAdmin.from("attendance").insert({
                class_id: parsed.data.classId,
                cadet_id: parsed.data.cadetId,
                status: parsed.data.status,
                marked_by: session.userId,
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
