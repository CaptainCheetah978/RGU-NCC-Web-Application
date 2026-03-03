/**
 * Server-side auth helpers for Server Actions.
 * Uses the anon supabase client to read the *caller's* session from the
 * request cookie, then looks up their role from the profiles table.
 *
 * Never use supabaseAdmin for this — admin bypasses RLS and we must read
 * the actual session of the calling user.
 */
"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Role } from "@/types";

/**
 * Returns the current user's role from their session, or null if not
 * authenticated. Call this at the top of every sensitive Server Action.
 */
export async function getCallerRole(): Promise<Role | null> {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Create a per-request server client using the caller's cookie
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    cookie: cookieStore.toString(),
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;

        // Read role from profiles (subject to RLS — user can only read their own)
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        return (profile?.role as Role) ?? null;
    } catch {
        return null;
    }
}

/** Convenience: returns the caller's user id and role, or null if unauthed. */
export async function getCallerSession(): Promise<{ userId: string; role: Role } | null> {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    cookie: cookieStore.toString(),
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;

        const { data: profile } = await supabase
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
