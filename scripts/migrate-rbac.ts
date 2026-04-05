import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Starting RBAC Role Migration...");

  // 1. Update Profiles Table
  console.log("Updating profiles: SUO -> CSUO");
  const { data: suoData, error: suoErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'CSUO' })
    .eq('role', 'SUO')
    .select();
  
  if (suoErr) console.error("Error updating SUO profiles:", suoErr);
  else console.log(`Updated ${suoData?.length || 0} SUO profiles to CSUO.`);

  console.log("Updating profiles: UO -> CJUO");
  const { data: uoData, error: uoErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'CJUO' })
    .eq('role', 'UO')
    .select();
    
  if (uoErr) console.error("Error updating UO profiles:", uoErr);
  else console.log(`Updated ${uoData?.length || 0} UO profiles to CJUO.`);

  // 2. Update Auth raw_user_meta_data 
  // (Optional because our app mainly relies on profiles table now, but good for completeness)
  console.log("Fetching all users to check meta_data...");
  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersErr) {
    console.error("Error fetching users:", usersErr);
  } else {
    for (const user of usersData.users) {
      if (user.user_metadata?.role === 'SUO') {
        process.stdout.write(`Updating meta_data for SUO ${user.id}... `);
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, role: 'CSUO' }
        });
        console.log("Done.");
      } else if (user.user_metadata?.role === 'UO') {
        process.stdout.write(`Updating meta_data for UO ${user.id}... `);
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, role: 'CJUO' }
        });
        console.log("Done.");
      }
    }
  }

  console.log("\nMigration completed successfully.");
}

main().catch(console.error);
