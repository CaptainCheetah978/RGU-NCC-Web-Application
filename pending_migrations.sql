-- =============================================
-- NCC RGU App - Required SQL Migrations
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add missing columns to the notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Note';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS forwarded_to_ano BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS original_sender_id UUID REFERENCES profiles(id);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS original_sender_name TEXT;

-- 2. Create the activity_log table (for ANO audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    performed_by_name TEXT NOT NULL,
    target_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security on activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for activity_log
-- Anyone authenticated can read activity (ANO uses this page, others share the data fetch)
DROP POLICY IF EXISTS "Authenticated users can read activity log" ON activity_log;
CREATE POLICY "Authenticated users can read activity log"
    ON activity_log FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Any authenticated user can insert (log their own actions)
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;
CREATE POLICY "Authenticated users can insert activity"
    ON activity_log FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- SUPABASE STORAGE (Manual Steps via Dashboard)
-- =============================================
-- Storage bucket policies CANNOT be set via SQL.
-- Follow these steps in your Supabase Dashboard:
--
-- STEP 1: Create the bucket
--   Dashboard → Storage → New Bucket
--   Name: files
--   Public: NO (Private)  ← files are accessed via signed URLs only
--   Save
--
-- STEP 2: Add policies (Dashboard → Storage → files → Policies)
--   Policy 1 (Upload):  Operation = INSERT,  Check = auth.uid() IS NOT NULL
--   Policy 2 (Read):    Operation = SELECT,  Using = auth.uid() IS NOT NULL
--   Policy 3 (Delete):  Operation = DELETE,  Using = auth.uid() IS NOT NULL
--
-- Signed URLs expire after 1 hour. The app regenerates them on page load.

