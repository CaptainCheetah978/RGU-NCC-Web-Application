"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type UnitBranding = {
    id: string;
    name: string;
    number?: string;
    institution_name?: string;
    logo_url?: string;
    secondary_logo_url?: string;
    primary_color?: string;
    branding_config?: Record<string, unknown>;
};

/**
 * Fetches branding details for a specific unit.
 * Used for both unauthenticated (login page) and authenticated (dashboard) flows.
 */
export async function getUnitBrandingAction(unitId?: string): Promise<UnitBranding | null> {
    let query = supabaseAdmin.from("units").select("*");

    if (unitId) {
        query = query.eq("id", unitId);
    } else {
        // Default: return the first unit (typically the primary deployment unit)
        query = query.limit(1);
    }

    const { data, error } = await query.single();

    if (error || !data) {
        console.error("getUnitBrandingAction error:", error?.message);
        return null;
    }

    return data as UnitBranding;
}

/**
 * Convenience: Fetches branding for a unit by its NAME.
 */
export async function getUnitBrandingByNameAction(name: string): Promise<UnitBranding | null> {
    const { data, error } = await supabaseAdmin
        .from("units")
        .select("*")
        .eq("name", name)
        .single();

    if (error || !data) return null;
    return data as UnitBranding;
}
