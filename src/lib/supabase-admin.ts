
import { createClient } from '@supabase/supabase-js';

// Note: access to the service role key is RESTRICTED to server-side code only.
// Never expose this client to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
    throw new Error('Supabase Service Role Key is missing. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
