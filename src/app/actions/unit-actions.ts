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
    try {
        let query = supabaseAdmin.from("units").select("*");

        if (unitId) {
            query = query.eq("id", unitId);
        } else {
            // Default: return the first unit (typically the primary deployment unit)
            query = query.limit(1);
        }

        const { data, error } = await query;

        if (error) {
            console.error("getUnitBrandingAction: database error:", error.message);
            return null;
        }

        if (!data || data.length === 0) return null;

        return data[0] as UnitBranding;
    } catch (err) {
        console.error("getUnitBrandingAction: unexpected error:", err);
        return null;
    }
}

/**
 * Convenience: Fetches branding for a unit by its NAME.
 */
export async function getUnitBrandingByNameAction(name: string): Promise<UnitBranding | null> {
    const { data, error } = await supabaseAdmin
        .from("units")
        .select("*")
        .eq("name", name)
        .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0] as UnitBranding;
}
