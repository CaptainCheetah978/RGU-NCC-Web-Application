"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

/** Roles allowed to manage (delete) resources */
const MANAGE_ROLES: Role[] = [Role.ANO, Role.SUO, Role.UO];
const ADMIN_ROLES: Role[] = [Role.ANO, Role.SUO];

type ActionResult = { success: boolean; error?: string };

// ── Delete Class ─────────────────────────────────────────────────────────────

export async function deleteClassAction(
    classId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!MANAGE_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    try {
        // Cascade: delete attendance records for this class first
        await supabaseAdmin.from("attendance").delete().eq("class_id", classId);
        const { error } = await supabaseAdmin
            .from("classes")
            .delete()
            .eq("id", classId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Delete Cadet ─────────────────────────────────────────────────────────────

export async function deleteCadetAction(
    cadetId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (session.role !== Role.ANO)
        return { success: false, error: "Forbidden: only ANO can remove cadets." };

    try {
        // Cascade: delete all related data first
        await supabaseAdmin
            .from("attendance")
            .delete()
            .eq("cadet_id", cadetId);
        await supabaseAdmin
            .from("notes")
            .delete()
            .eq("sender_id", cadetId);
        await supabaseAdmin
            .from("notes")
            .delete()
            .eq("recipient_id", cadetId);
        await supabaseAdmin
            .from("certificates")
            .delete()
            .eq("user_id", cadetId);
        const { error } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", cadetId);
        if (error) return { success: false, error: error.message };

        // Also delete the auth user so they can't log in anymore
        await supabaseAdmin.auth.admin.deleteUser(cadetId);

        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Delete Announcement ──────────────────────────────────────────────────────

export async function deleteAnnouncementAction(
    announcementId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!ADMIN_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    try {
        const { error } = await supabaseAdmin
            .from("announcements")
            .delete()
            .eq("id", announcementId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Delete Certificate ───────────────────────────────────────────────────────

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

// ── Remove user by name (one-off admin utility) ──────────────────────────────

export async function removeUserByName(
    userName: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (session.role !== Role.ANO)
        return { success: false, error: "Forbidden: only ANO can remove users." };

    try {
        // Find the profile by name
        const { data: profiles, error: findError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .ilike("full_name", userName);

        if (findError)
            return { success: false, error: findError.message };
        if (!profiles || profiles.length === 0)
            return { success: false, error: `No user found with name "${userName}".` };

        const results: string[] = [];
        for (const profile of profiles) {
            // Cascade delete all related data
            await supabaseAdmin.from("attendance").delete().eq("cadet_id", profile.id);
            await supabaseAdmin.from("notes").delete().eq("sender_id", profile.id);
            await supabaseAdmin.from("notes").delete().eq("recipient_id", profile.id);
            await supabaseAdmin.from("certificates").delete().eq("user_id", profile.id);
            await supabaseAdmin.from("announcements").delete().eq("author_id", profile.id);
            await supabaseAdmin.from("activity_log").delete().eq("performed_by", profile.id);
            await supabaseAdmin.from("profiles").delete().eq("id", profile.id);
            // Delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(profile.id);
            results.push(`Removed "${profile.full_name}" (${profile.id})`);
        }

        return { success: true, error: results.join("; ") };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
