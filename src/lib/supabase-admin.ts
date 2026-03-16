
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Note: access to the service role key is RESTRICTED to server-side code only.
// Never expose this client to the browser.

let cachedAdmin: SupabaseClient | null = null;

function createAdminClient() {
    if (cachedAdmin) return cachedAdmin;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return cachedAdmin;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const client = createAdminClient();
        // @ts-expect-error pass-through proxy
        return client[prop];
    },
});
