# Frequently Asked Questions & Troubleshooting

This guide addresses common setup hurdles and operational issues encountered during local development and deployment.

## 1. Common Setup Issues

**Q: I cloned the repository, but my application will not build due to missing dependencies.**
**A:** Run `npm ci` or `npm install` in the root folder. Additionally, ensure you are using Node.js v20.x or above, as Next.js 16+ Server Actions and React 19 abstractions require modern runtime features.

**Q: The application shows a blank screen or loops on the login page initially.**
**A:** Check your `.env.local` file. You must have valid strings for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Also, ensure you have ran the `supabase-policies.sql` and initialized your DB schemas.

## 2. Row Level Security (RLS) Policy Errors

**Q: Certain delete buttons (e.g., removing a Cadet, Class, or Note) seem to click but nothing happens.**
**A:** Client-side delete operations are aggressively blocked by standard Supabase RLS policies for security. If you are developing a new component, you must route deletion commands through **Next.js Server Actions** (e.g., `src/app/actions/delete-actions.ts`), which utilize `supabaseAdmin` to safely elevate privileges and bypass RLS after verifying the user's role.

**Q: Data is not showing up on my dashboard! It says 'No Records Found'.**
**A:** Your login session might not have the correct RLS clearances configured. Double check that the SQL file containing `supabase-policies.sql` was successfully executed in your Supabase SQL Editor to link user ID claims.

## 3. Storage Bucket Configuration

**Q: I'm getting a 403 Forbidden or "Unauthorized" error when I try to upload or view profile images and PDF certificates.**
**A:** You need to explicitly configure your Supabase Storage buckets:
1. Navigate to the Supabase Dashboard -> **Storage**.
2. Create a specific bucket named `files`.
3. Set the bucket to **Private**.
4. Set up the Storage Policies to allow **INSERT**, **SELECT**, **UPDATE**, and **DELETE** specifically for authenticated users (`auth.role() = 'authenticated'`). The system uses temporarily signed URLs to access Private buckets securely.

## 4. Local Development Debugging

**Q: I made changes to a component but the browser isn't updating, particularly on mobile or PWA.**
**A:** The application implements an aggressive Service Worker (`public/sw.js`) with a `stale-while-revalidate` cache approach.
- On Chrome Desktop: Open DevTools > **Application** > **Storage** > Click **"Clear site data"**.
- Alternatively, check "Update on reload" under the Service Workers tab in DevTools.

**Q: How do I debug API routes vs Server Actions?**
**A:** Since Next.js uses Server Actions extensively here, look at the server console window where you started `npm run dev` rather than the browser DevTools `Network` tab. `console.log` statements inside `/actions/` directories will print to your terminal, not the browser.
