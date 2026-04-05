"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";
import { Permissions } from "@/lib/permissions";

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

    // Try with the full column set first (includes newer schema columns)
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, email, unit_id')
        .eq('id', userId)
        .single();
    
    if (!error) return data;

    // PGRST116 = "no rows found" — profile genuinely doesn't exist, don't retry
    if (error.code === 'PGRST116') {
        console.warn(`getProfileByIdAction: no profile row found for user ${userId}`);
        return null;
    }

    // Any other error (e.g. unknown column — migration not applied yet) — fall back to core columns
    console.warn('getProfileByIdAction full-column query failed, trying core fallback:', error.message);
    const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number')
        .eq('id', userId)
        .single();

    if (fallbackError) {
        console.error('getProfileByIdAction fallback also failed:', fallbackError);
        return null;
    }
    return fallbackData;
}

// ── Get All Profiles (admin-bypasses RLS, scoped to caller's unit) ───────────

export async function getAllProfilesAction(
    accessToken: string
): Promise<{ success: boolean; data?: ProfileRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    let query = supabaseAdmin.from("profiles").select(PROFILE_READ_COLUMNS);

    // Multi-tenancy: scope to the caller's unit if available
    if (session.unitId) {
        query = query.eq("unit_id", session.unitId);
    }
    // If no unitId, we're in single-unit mode — return all profiles (no filter needed)

    const { data, error } = await query;
    if (error) {
        // If the error is about unit_id column not existing, retry without filter
        if (error.message?.includes("unit_id") || error.code === '42703') {
            console.warn("getAllProfilesAction: unit_id column not found, fetching all profiles");
            const { data: fallbackData, error: fallbackError } = await supabaseAdmin
                .from("profiles")
                .select(PROFILE_READ_COLUMNS);
            if (fallbackError) return { success: false, error: fallbackError.message };
            return { success: true, data: (fallbackData as ProfileRow[]) || [] };
        }
        return { success: false, error: error.message };
    }
    return { success: true, data: (data as ProfileRow[]) || [] };
}

// Keep getProfilesAction as an alias for getAllProfilesAction if needed by other contexts
export const getProfilesAction = getAllProfilesAction;

// ── Get All Certificates (admin-bypasses RLS, scoped to caller's unit) ───────

export async function getAllCertificatesAction(
    accessToken: string
): Promise<{ success: boolean; data?: CertificateRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Get the unit's profile IDs first to scope certificates
    let profileQuery = supabaseAdmin.from("profiles").select("id");
    if (session.unitId) {
        profileQuery = profileQuery.eq("unit_id", session.unitId);
    }
    // If no unitId, we're in single-unit mode — fetch all profile IDs

    let profileIds;
    const { data: profileData, error: profileErr } = await profileQuery;
    if (profileErr) {
        // If unit_id column doesn't exist, retry without filter
        if (profileErr.message?.includes("unit_id") || profileErr.code === '42703') {
            console.warn("getAllCertificatesAction: unit_id column not found, fetching all");
            const { data: fallbackIds, error: fallbackErr } = await supabaseAdmin
                .from("profiles").select("id");
            if (fallbackErr) return { success: false, error: fallbackErr.message };
            profileIds = fallbackIds;
        } else {
            return { success: false, error: profileErr.message };
        }
    } else {
        profileIds = profileData;
    }

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

    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Only ANO/CTO/CSUO can update other profiles; others can only update their own
    const isAdmin = Permissions.CAN_MANAGE_USERS.has(session.role);
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

    // Build the upsert payload with only guaranteed-to-exist core columns
    const profilePayload: Record<string, unknown> = {
        id: user.id,
        full_name: isANO ? 'Associate NCC Officer' : 'New User',
        role: isANO ? Role.ANO : Role.CADET,
        updated_at: new Date().toISOString(),
    };

    // Try to resolve a unit_id — but treat a missing 'units' table as non-fatal
    try {
        const { data: defaultUnit } = await supabaseAdmin
            .from('units')
            .select('id')
            .limit(1)
            .single();
        if (defaultUnit?.id) profilePayload.unit_id = defaultUnit.id;
    } catch {
        console.warn('ensureUserProfileAction: units table not available, skipping unit_id assignment');
    }

    // Try to include email — non-fatal if column doesn't exist yet
    if (user.email) profilePayload.email = user.email;

    // First try the full upsert; if it fails due to unknown columns, retry with core fields only
    let newProfile: Record<string, unknown> | null = null;
    const { data: upsertData, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert(profilePayload)
        .select()
        .single();

    if (!createError) {
        newProfile = upsertData;
    } else {
        console.warn('ensureUserProfileAction full upsert failed, retrying with core fields only:', createError.message);
        const corePayload = {
            id: user.id,
            full_name: profilePayload.full_name,
            role: profilePayload.role,
            updated_at: profilePayload.updated_at,
        };
        const { data: coreData, error: coreError } = await supabaseAdmin
            .from('profiles')
            .upsert(corePayload)
            .select()
            .single();
        if (coreError) {
            console.error('ensureUserProfileAction core upsert also failed:', coreError);
            throw new Error('Failed to auto-create profile');
        }
        newProfile = coreData;
    }

    return newProfile;
}
