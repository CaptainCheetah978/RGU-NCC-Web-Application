"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

/** Roles allowed to post announcements */
const ANNOUNCEMENT_ROLES: Role[] = [Role.ANO, Role.SUO];

type ActionResult = { success: boolean; error?: string };

export async function addAnnouncementAction(
    data: { title: string; content: string; priority: string },
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!ANNOUNCEMENT_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    try {
        const { error } = await supabaseAdmin.from("announcements").insert({
            title: data.title,
            content: data.content,
            author_id: session.userId,
            priority: data.priority.toUpperCase(),
            unit_id: session.unitId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

export async function deleteAnnouncementAction(
    announcementId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!ANNOUNCEMENT_ROLES.includes(session.role))
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

// ── Get Announcements ────────────────────────────────────────────────────────

/**
 * Fetches all announcements for the caller's unit.
 */
export async function getAnnouncementsAction(accessToken: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Multi-tenancy: fetch only announcements for caller's unit
        const { data, error } = await supabaseAdmin
            .from("announcements")
            .select("id, title, content, author_id, priority, created_at")
            .eq("unit_id", session.unitId);

        if (error) return { success: false, error: error.message };
        return { success: true, data: data || [] };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
