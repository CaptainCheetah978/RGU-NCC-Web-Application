"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStableAuthEmail } from "@/lib/auth-identifiers";

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
