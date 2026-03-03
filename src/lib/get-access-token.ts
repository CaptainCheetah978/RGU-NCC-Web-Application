import { supabase } from "@/lib/supabase-client";

/**
 * Returns the current user's access token from the Supabase session.
 * Call this on the client before invoking any Server Action that
 * requires authentication.
 */
export async function getAccessToken(): Promise<string | undefined> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
}
