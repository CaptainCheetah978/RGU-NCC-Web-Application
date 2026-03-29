"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Role } from "@/types";

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

    // Use admin client to bypass RLS for profile creation (solves PGRST116 auto-healing issue)
    const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.id,
            full_name: isANO ? 'Associate NCC Officer' : 'New User',
            role: isANO ? Role.ANO : Role.CADET,
            email: user.email,
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
