"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Role } from "@/types";

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
