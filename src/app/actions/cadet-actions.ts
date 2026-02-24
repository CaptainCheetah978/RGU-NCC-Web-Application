"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Role, Wing, Gender } from "@/types";
import { revalidatePath } from "next/cache";

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

export async function createCadetAccount(formData: CreateCadetFormData) {
    try {
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
        } = formData;

        const cleanUsername = name.replace(/\s+/g, '').toLowerCase();
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
                access_pin: pin,
                updated_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error("Profile Creation Failed:", profileError);
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        revalidatePath('/dashboard/cadets');
        return { success: true, userId };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Server Action Error:", message);
        return { success: false, error: message };
    }
}

export async function updateCadetPin(cadetId: string, newPin: string) {
    try {
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

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Update PIN Error:", message);
        return { success: false, error: message };
    }
}

export async function getCadetPin(cadetId: string): Promise<string | null> {
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
