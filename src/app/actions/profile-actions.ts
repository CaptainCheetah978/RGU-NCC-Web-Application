"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

const PROFILE_READ_COLUMNS =
    "id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, status";
const CERTIFICATE_READ_COLUMNS = "id, user_id, name, type, file_data, upload_date";

export type ProfileRow = {
    id: string;
    full_name: string | null;
    role: string | null;
    regimental_number: string | null;
    wing: string | null;
    rank: string | null;
    avatar_url: string | null;
    enrollment_year: number | null;
    blood_group: string | null;
    gender: string | null;
    unit_name: string | null;
    unit_number: string | null;
    status: string | null;
};

export type CertificateRow = {
    id: string;
    user_id: string;
    name: string;
    type: string;
    file_data: string;
    upload_date: string;
};

// UUID v4 regex — used to validate IDs before passing to DB queries
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

// Fields that any authenticated user may update on their own profile.
// Critically: "role" and "unit_id" are intentionally excluded — those
// can only be changed by ANO/SUO via the admin-level allowlist below.
const SELF_UPDATE_ALLOWED: ReadonlySet<string> = new Set([
    "full_name",
    "regimental_number",
    "rank",
    "wing",
    "gender",
    "unit_number",
    "unit_name",
    "enrollment_year",
    "blood_group",
    "avatar_url",
    "status",
]);

// Fields that ANO/SUO may also update on any profile.
const ADMIN_UPDATE_ALLOWED: ReadonlySet<string> = new Set([
    ...SELF_UPDATE_ALLOWED,
    "access_pin",
    "role",
    "unit_id",
]);

export async function getProfileByIdAction(userId: string) {
    if (!isUUID(userId)) return null;

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, email, unit_id')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error("getProfileByIdAction error:", error);
        return null;
    }
    return data;
}

// ── Get All Profiles (admin-bypasses RLS, scoped to caller's unit) ───────────

export async function getAllProfilesAction(
    accessToken: string
): Promise<{ success: boolean; data?: ProfileRow[]; error?: string }> {
    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    let query = supabaseAdmin.from("profiles").select(PROFILE_READ_COLUMNS);

    // Scope to the caller's unit so users cannot enumerate other units' data
    if (session.unitId) {
        query = query.eq("unit_id", session.unitId);
    } else {
        // No unit assigned — can only see their own profile
        query = query.eq("id", session.userId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as ProfileRow[]) || [] };
}

// ── Get All Certificates (admin-bypasses RLS, scoped to caller's unit) ───────

export async function getAllCertificatesAction(
    accessToken: string
): Promise<{ success: boolean; data?: CertificateRow[]; error?: string }> {
    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Get the unit's profile IDs first to scope certificates
    let profileQuery = supabaseAdmin.from("profiles").select("id");
    if (session.unitId) {
        profileQuery = profileQuery.eq("unit_id", session.unitId);
    } else {
        profileQuery = profileQuery.eq("id", session.userId);
    }
    const { data: profileIds, error: profileErr } = await profileQuery;
    if (profileErr) return { success: false, error: profileErr.message };

    const ids = (profileIds || []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return { success: true, data: [] };

    const { data, error } = await supabaseAdmin
        .from("certificates")
        .select(CERTIFICATE_READ_COLUMNS)
        .in("user_id", ids);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as CertificateRow[]) || [] };
}

// ── Update Profile (admin-bypasses RLS, field-allowlisted) ───────────────────

export async function updateProfileAction(
    id: string,
    payload: Record<string, unknown>,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    if (!isUUID(id)) return { success: false, error: "Invalid profile ID." };

    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Only ANO/SUO can update other profiles; others can only update their own
    const isAdmin = [Role.ANO, Role.SUO].includes(session.role);
    if (!isAdmin && session.userId !== id) {
        return { success: false, error: "Forbidden: insufficient permissions." };
    }

    // Filter payload to only allowed fields to prevent privilege escalation
    const allowedFields = isAdmin ? ADMIN_UPDATE_ALLOWED : SELF_UPDATE_ALLOWED;
    const safePayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => allowedFields.has(key))
    );

    if (Object.keys(safePayload).length === 0) {
        return { success: false, error: "No valid fields to update." };
    }

    const { error } = await supabaseAdmin
        .from("profiles")
        .update(safePayload)
        .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function ensureUserProfileAction(accessToken: string) {
    if (!accessToken) {
        throw new Error("Unauthorized");
    }

    // Verify token directly (bypassing getCallerSession which depends on a profile existing)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user) {
        throw new Error("Unauthorized: Invalid session");
    }

    const isANO = user.email?.startsWith('ano_') || false;

    // 1. Get a default unit ID to assign (first available unit)
    const { data: defaultUnit } = await supabaseAdmin
        .from('units')
        .select('id')
        .limit(1)
        .single();

    // 2. Use admin client to bypass RLS for profile creation (solves PGRST116 auto-healing issue)
    const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: isANO ? 'Associate NCC Officer' : 'New User',
            role: isANO ? Role.ANO : Role.CADET,
            email: user.email,
            unit_id: defaultUnit?.id,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (createError) {
        console.error("ensureUserProfileAction error:", createError);
        throw new Error("Failed to auto-create profile");
    }

    return newProfile;
}

// ── Get Profiles ─────────────────────────────────────────────────────────────

/**
 * Fetches all user profiles for the caller's unit.
 */
export async function getProfilesAction(accessToken: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Multi-tenancy: only fetch profiles for the caller's unit
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, status")
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

// ── Update Profile ────────────────────────────────────────────────────────────

/**
 * Updates a user's profile data.
 * ANO can update ANY profile; users can only update their own.
 */
export async function updateProfileAction(
    userId: string,
    updates: Record<string, any>,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Security: users can only update their own, unless they are ANO
    if (session.role !== Role.ANO && session.userId !== userId) {
        return { success: false, error: "Forbidden: you can only update your own profile." };
    }

    try {
        const { error } = await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", userId);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
