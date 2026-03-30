"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

/** Roles allowed to manage class scheduling */
const MANAGE_ROLES: Role[] = [Role.ANO, Role.SUO, Role.UO];

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

    let query = supabaseAdmin
        .from("classes")
        .select("id, title, date, time, instructor_id, description, tag");

    // Scope to the caller's unit so users cannot enumerate other units' classes
    if (session.unitId) {
        query = query.eq("unit_id", session.unitId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as ClassRow[]) || [] };
}

type ClassInsertPayload = {
    id?: string;
    title: string;
    date: string;
    time: string;
    instructor_id: string;
    description?: string;
    tag?: string;
};

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
    if (!MANAGE_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    try {
        const payload: ClassInsertPayload & { unit_id?: string } = {
            title: classData.title,
            date: classData.date,
            time: classData.time,
            instructor_id: classData.instructorId,
            description: classData.description,
            tag: classData.tag || 'Training',
            unit_id: session.unitId,
        };
        if (classData.id) payload.id = classData.id;

        const { error } = await supabaseAdmin.from("classes").insert(payload);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
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
