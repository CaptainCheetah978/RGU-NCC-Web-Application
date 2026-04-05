"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";

import { Permissions } from "@/lib/permissions";

type ActionResult = { success: boolean; error?: string };

type ClassRow = {
    id: string;
    title: string;
    date: string;
    time: string;
    instructor_id: string;
    description: string | null;
    tag: string | null;
};

// ── Get Classes ───────────────────────────────────────────────────────────────

export async function getClassesAction(
    accessToken: string
): Promise<{ success: boolean; data?: ClassRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        let query = supabaseAdmin
            .from("classes")
            .select("id, title, date, time, instructor_id, description, tag");

        // Scope to the caller's unit so users cannot enumerate other units' classes
        // Multi-tenancy enforcement at the server layer
        if (session.unitId) {
            query = query.eq("unit_id", session.unitId);
        }

        const { data, error } = await query;
        if (error) {
            // If the error is about unit_id column not existing, retry without filter
            if (error.message?.includes("unit_id") || error.code === '42703') {
                console.warn("getClassesAction: unit_id column not found, fetching without unit filter");
                const { data: fallbackData, error: fallbackError } = await supabaseAdmin
                    .from("classes")
                    .select("id, title, date, time, instructor_id, description, tag");
                if (fallbackError) {
                    console.error("getClassesAction fallback error:", fallbackError);
                    return { success: false, error: fallbackError.message };
                }
                return { success: true, data: (fallbackData as ClassRow[]) || [] };
            }
            console.error("getClassesAction DB error:", error);
            return { success: false, error: error.message };
        }
        return { success: true, data: (data as ClassRow[]) || [] };
    } catch (e: unknown) {
        console.error("getClassesAction unexpected error:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}



// ── Add Class ────────────────────────────────────────────────────────────────

export async function addClassAction(
    classData: {
        id?: string;
        title: string;
        date: string;
        time: string;
        instructorId: string;
        description?: string;
        tag?: string;
    },
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!Permissions.CAN_MANAGE_CLASSES.has(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    try {
        const payload: Record<string, unknown> = {
            title: classData.title,
            date: classData.date,
            time: classData.time,
            instructor_id: classData.instructorId,
            description: classData.description,
            tag: classData.tag || 'Training',
        };
        if (classData.id) payload.id = classData.id;
        // Only include unit_id if available (migration 005 applied)
        if (session.unitId) payload.unit_id = session.unitId;

        let insertError;
        const { error } = await supabaseAdmin.from("classes").insert(payload);
        insertError = error;

        // If unit_id column doesn't exist, retry without it
        if (insertError && (insertError.message?.includes("unit_id") || insertError.code === '42703')) {
            console.warn("addClass: unit_id column not found, inserting without it");
            delete payload.unit_id;
            const { error: retryError } = await supabaseAdmin.from("classes").insert(payload);
            insertError = retryError;
        }

        if (insertError) {
            console.error("addClass insert error:", insertError);
            return { success: false, error: insertError.message };
        }
        return { success: true };
    } catch (e: unknown) {
        console.error("addClassAction unexpected error:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Delete Class ─────────────────────────────────────────────────────────────

export async function deleteClassAction(
    classId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };
    if (!Permissions.CAN_MANAGE_CLASSES.has(session.role))
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
