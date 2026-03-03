"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { CreateCadetSchema, UpdatePinSchema } from "@/lib/schemas";
import { Role, Wing, Gender } from "@/types";
import { revalidatePath } from "next/cache";

/** Roles that are allowed to create or manage cadet accounts */
const CADET_MANAGE_ROLES: Role[] = [Role.ANO, Role.SUO];

interface CreateCadetFormData {
    name: string;
    regimentalNumber: string;
    rank: Role;
    wing: Wing;
    gender: Gender;
    unitNumber: string;
    unitName: string;
    enrollmentYear: number;
    bloodGroup: string;
    pin: string;
}

export async function createCadetAccount(formData: CreateCadetFormData, accessToken: string) {
    // ── 1. Auth: verify caller is logged in and has permission ─────────────────
    const session = await getCallerSession(accessToken);
    if (!session) {
        return { success: false, error: "Unauthorized: you must be logged in." };
    }
    if (!CADET_MANAGE_ROLES.includes(session.role)) {
        return { success: false, error: `Forbidden: your role (${session.role}) cannot create cadet accounts.` };
    }

    // ── 2. Validate input with Zod ──────────────────────────────────────────────
    const parsed = CreateCadetSchema.safeParse(formData);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
        return { success: false, error: firstError };
    }
    const {
        name,
        regimentalNumber,
        rank,
        wing,
        gender,
        unitNumber,
        unitName,
        enrollmentYear,
        bloodGroup,
        pin,
    } = parsed.data;

    try {
        const cleanUsername = name.replace(/\s+/g, '').toLowerCase();
        const pseudoEmail = `${rank.toLowerCase()}_${cleanUsername}@nccrgu.internal`;
        const password = `${pin}-ncc-rgu`;

        // ── 3. Create Auth User ─────────────────────────────────────────────────
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: pseudoEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: rank,
            }
        });

        if (authError) {
            if (authError.message.includes("already registered")) {
                return { success: false, error: "A user with this name and role already exists." };
            }
            return { success: false, error: `Failed to create user account: ${authError.message}` };
        }

        const userId = authData.user.id;

        // ── 4. Create Profile ───────────────────────────────────────────────────
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                full_name: name,
                role: rank,
                regimental_number: regimentalNumber,
                wing: wing,
                gender: gender,
                unit_number: unitNumber,
                unit_name: unitName,
                enrollment_year: enrollmentYear,
                blood_group: bloodGroup || null,
                access_pin: pin,
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            // Roll back auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return { success: false, error: `Profile creation failed: ${profileError.message}` };
        }

        revalidatePath('/dashboard/cadets');
        return { success: true, userId };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}

export async function updateCadetPin(cadetId: string, newPin: string, accessToken: string) {
    // ── 1. Auth ─────────────────────────────────────────────────────────────────
    const session = await getCallerSession(accessToken);
    if (!session) {
        return { success: false, error: "Unauthorized: you must be logged in." };
    }
    if (!CADET_MANAGE_ROLES.includes(session.role)) {
        return { success: false, error: `Forbidden: your role (${session.role}) cannot update PINs.` };
    }

    // ── 2. Validate ─────────────────────────────────────────────────────────────
    const parsed = UpdatePinSchema.safeParse({ cadetId, newPin });
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
        return { success: false, error: firstError };
    }

    try {
        const password = `${parsed.data.newPin}-ncc-rgu`;

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            parsed.data.cadetId,
            { password }
        );
        if (authError) return { success: false, error: `Auth update failed: ${authError.message}` };

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ access_pin: parsed.data.newPin })
            .eq('id', parsed.data.cadetId);
        if (profileError) return { success: false, error: `Profile update failed: ${profileError.message}` };

        revalidatePath('/dashboard/cadets');
        return { success: true };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
    }
}

export async function getCadetPin(cadetId: string, accessToken: string): Promise<string | null> {
    // Only ANO/SUO can view PINs
    const session = await getCallerSession(accessToken);
    if (!session || !CADET_MANAGE_ROLES.includes(session.role)) return null;

    // Validate the ID is a valid UUID before querying
    const uuidCheck = UpdatePinSchema.shape.cadetId.safeParse(cadetId);
    if (!uuidCheck.success) return null;

    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("access_pin")
            .eq("id", cadetId)
            .single();

        if (error || !data) return null;
        return data.access_pin || null;
    } catch {
        return null;
    }
}
