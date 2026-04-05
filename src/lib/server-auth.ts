/**
 * Server-side auth helpers for Server Actions.
 *
 * The app uses @supabase/supabase-js with localStorage for session storage
 * (not @supabase/ssr with cookies). This means Server Actions cannot read
 * the session from cookies.
 *
 * Instead, the client passes its access_token when calling a Server Action,
 * and we verify it here using supabaseAdmin.auth.getUser(token).
 */
"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Role } from "@/types";

/**
 * Verifies the caller's access token and returns their user id and role.
 * Returns null if the token is invalid or the user has no profile.
 *
 * @param accessToken - The JWT access token from the client's Supabase session
 */
export async function getCallerSession(
    accessToken: string | undefined
): Promise<{ userId: string; role: Role; unitId?: string; userName?: string } | null> {
    if (!accessToken) return null;

    try {
        // Verify the token is valid and get the user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
        if (error || !user) return null;

        // Try full column set first (includes unit_id from migration 005)
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from("profiles")
            .select("role, full_name, unit_id")
            .eq("id", user.id)
            .single();

        if (!profileErr && profile?.role) {
            return { 
                userId: user.id, 
                role: profile.role as Role,
                unitId: profile.unit_id,
                userName: profile.full_name || undefined
            };
        }

        // PGRST116 = "no rows" — profile genuinely missing, can't recover
        if (profileErr?.code === 'PGRST116') {
            console.error("getCallerSession: no profile row for user:", user.id);
            return null;
        }

        // Any other error (e.g., unit_id column doesn't exist) — fallback to core columns
        console.warn("getCallerSession full query failed, trying core fallback:", profileErr?.message);
        const { data: fallback, error: fallbackErr } = await supabaseAdmin
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

        if (fallbackErr || !fallback?.role) {
            console.error("getCallerSession fallback also failed:", fallbackErr?.message);
            return null;
        }

        return { 
            userId: user.id, 
            role: fallback.role as Role,
            unitId: undefined, // column doesn't exist yet — single-tenant mode
            userName: fallback.full_name || undefined
        };
    } catch (e: unknown) {
        console.error("getCallerSession unexpected error:", e);
        return null;
    }
}

/**
 * Convenience: returns just the caller's role, or null if unauthed.
 */
export async function getCallerRole(
    accessToken: string | undefined
): Promise<Role | null> {
    const session = await getCallerSession(accessToken);
    return session?.role ?? null;
}
