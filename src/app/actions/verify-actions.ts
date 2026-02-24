"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

interface VerifyResult {
    found: boolean;
    person?: {
        name: string;
        role: string;
        regimentalNumber?: string;
        wing?: string;
        unitNumber?: string;
        unitName?: string;
        bloodGroup?: string;
        enrollmentYear?: string;
        avatarUrl?: string;
    };
}

export async function verifyCadetById(id: string): Promise<VerifyResult> {
    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("full_name, role, regimental_number, wing, unit_number, unit_name, blood_group, enrollment_year, avatar_url")
            .eq("id", id)
            .single();

        if (error || !data) {
            return { found: false };
        }

        return {
            found: true,
            person: {
                name: data.full_name || "Unknown",
                role: data.role || "CADET",
                regimentalNumber: data.regimental_number || undefined,
                wing: data.wing || undefined,
                unitNumber: data.unit_number || undefined,
                unitName: data.unit_name || undefined,
                bloodGroup: data.blood_group || undefined,
                enrollmentYear: data.enrollment_year?.toString() || undefined,
                avatarUrl: data.avatar_url || undefined,
            },
        };
    } catch {
        return { found: false };
    }
}
