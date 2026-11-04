"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
    getStableAuthEmail,
    normalizeLoginUsername,
} from "@/lib/auth-identifiers";

export async function resolveLoginUsername(
    username: string,
): Promise<{ success: boolean; email?: string; error?: string }> {
    const normalizedUsername = normalizeLoginUsername(username);
    if (!/^C\d{4}$/.test(normalizedUsername)) {
        return { success: false, error: "Enter your Login ID, for example C1234." };
    }

    const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("regimental_number")
        .eq("login_username", normalizedUsername)
        .limit(1)
        .maybeSingle();

    if (error || !profile?.regimental_number) {
        return { success: false, error: "Login ID not found. Check the last four digits of your registration number." };
    }

    return {
        success: true,
        email: getStableAuthEmail(profile.regimental_number),
    };
}

/**
 * Migrates a legacy account to the registration-number identity after login.
 * The migration is deliberately idempotent and never needs to block login.
 */
export async function migrateToStableAuthIdentity(
    accessToken: string,
    regimentalNumber: string,
): Promise<{ success: boolean; migrated: boolean; error?: string }> {
    if (!accessToken || !regimentalNumber.trim()) {
        return { success: false, migrated: false, error: "Missing identity data." };
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user) {
        return { success: false, migrated: false, error: "Unauthorized." };
    }

    const stableEmail = getStableAuthEmail(regimentalNumber);
    if (user.email?.toLowerCase() === stableEmail) {
        return { success: true, migrated: false };
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: stableEmail,
        email_confirm: true,
    });
    if (updateError) {
        return { success: false, migrated: false, error: updateError.message };
    }

    return { success: true, migrated: true };
}
