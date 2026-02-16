"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Role, Wing, Gender } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCadetAccount(formData: any) {
    try {
        console.log("Server Action: Creating Cadet Account...", formData.name);

        const {
            name,
            regimentalNumber,
            rank, // Role
            wing,
            gender,
            unitNumber,
            unitName,
            enrollmentYear,
            bloodGroup,
            pin, // The PIN chosen by ANO/SUO
        } = formData;

        // generated email logic (same as client-side logic to keep consistency)
        // role_username_clean@nccrgu.internal
        const cleanUsername = name.replace(/\s+/g, '').toLowerCase();
        // Since role is variable, let's stick to a format. Actually, standard format:
        // rank_name_regno@nccrgu.internal might be too long.
        // Let's use the format from page.tsx: role_username_clean@nccrgu.internal
        // BUT, user might change role. Ideally we use something unique like Regimental Number.
        // However, existing logic uses Role + Name.
        // Let's stick to the existing logic:
        const pseudoEmail = `${rank.toLowerCase()}_${cleanUsername}@nccrgu.internal`;

        // Secure Password (PIN + Salt)
        const password = `${pin}-ncc-rgu`;

        // 1. Create Auth User
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
            console.error("Auth User Creation Failed:", authError);
            // Check if user already exists
            if (authError.message.includes("already registered")) {
                return { success: false, error: "User with this name/role already exists." };
            }
            throw authError;
        }

        const userId = authData.user.id;

        // 2. Create Profile (with Data & PIN)
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
                blood_group: bloodGroup,
                access_pin: pin, // Store Visible PIN
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error("Profile Creation Failed:", profileError);
            // Attempt to cleanup auth user?
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        revalidatePath('/dashboard/cadets');
        return { success: true, userId };

    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateCadetPin(cadetId: string, newPin: string) {
    try {
        console.log("Server Action: Updating PIN for", cadetId);

        const password = `${newPin}-ncc-rgu`;

        // 1. Update Auth Password
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            cadetId,
            { password: password }
        );

        if (authError) throw authError;

        // 2. Update Visible PIN
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ access_pin: newPin })
            .eq('id', cadetId);

        if (profileError) throw profileError;

        revalidatePath('/dashboard/cadets');
        return { success: true };

    } catch (error: any) {
        console.error("Update PIN Error:", error);
        return { success: false, error: error.message };
    }
}
