"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
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

export async function getProfileByIdAction(userId: string) {
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

// ── Get All Profiles (admin-bypasses RLS) ──────────────────────────────────

export async function getAllProfilesAction(
    accessToken: string
): Promise<{ success: boolean; data?: ProfileRow[]; error?: string }> {
    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_READ_COLUMNS);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as ProfileRow[]) || [] };
}

// ── Get All Certificates (admin-bypasses RLS) ─────────────────────────────

export async function getAllCertificatesAction(
    accessToken: string
): Promise<{ success: boolean; data?: CertificateRow[]; error?: string }> {
    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const { data, error } = await supabaseAdmin
        .from("certificates")
        .select(CERTIFICATE_READ_COLUMNS);
    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as CertificateRow[]) || [] };
}

// ── Update Profile (admin-bypasses RLS) ───────────────────────────────────

export async function updateProfileAction(
    id: string,
    payload: Record<string, unknown>,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    const { getCallerSession } = await import("@/lib/server-auth");
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Only ANO/SUO can update other profiles; others can only update their own
    const allowedRoles: Role[] = [Role.ANO, Role.SUO];
    if (!allowedRoles.includes(session.role) && session.userId !== id) {
        return { success: false, error: "Forbidden: insufficient permissions." };
    }

    const { error } = await supabaseAdmin
        .from("profiles")
        .update(payload)
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
