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
): Promise<{ userId: string; role: Role } | null> {
    if (!accessToken) return null;

    try {
        // Verify the token is valid and get the user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
        if (error || !user) return null;

        // Look up the user's role from the profiles table
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile?.role) return null;
        return { userId: user.id, role: profile.role as Role };
    } catch {
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
