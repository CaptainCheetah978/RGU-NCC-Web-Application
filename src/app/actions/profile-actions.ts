"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Role } from "@/types";

/** Roles allowed to edit other users' profiles */
const PROFILE_MANAGE_ROLES: Role[] = [Role.ANO, Role.SUO];

type ActionResult = { success: boolean; error?: string };

export async function updateProfileAction(
    profileId: string,
    updates: Record<string, unknown>,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Users can update their own profile; ANO/SUO can update any profile
    const isSelf = session.userId === profileId;
    if (!isSelf && !PROFILE_MANAGE_ROLES.includes(session.role))
        return { success: false, error: "Forbidden: insufficient permissions." };

    if (Object.keys(updates).length === 0)
        return { success: true }; // Nothing to update

    try {
        const { error } = await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", profileId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
