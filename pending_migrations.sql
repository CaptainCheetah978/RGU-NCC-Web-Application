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
-- SUPABASE STORAGE (Manual Step Required)
-- =============================================
-- You must create the 'files' storage bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: files
-- 4. Set Public: YES (so files can be accessed via public URLs)
-- 5. Click Save
--
-- Then add these storage policies:
-- Policy 1: Allow authenticated users to upload
-- Policy 2: Allow everyone to download (public read)
-- Policy 3: Allow ANO/SUO to delete
--
-- You can do this via Dashboard → Storage → files → Policies, or run:

-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('Allow uploads by authenticated', 'files', 'INSERT', 'auth.uid() IS NOT NULL')
ON CONFLICT DO NOTHING;

-- Allow public read
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('Allow public read', 'files', 'SELECT', 'true')
ON CONFLICT DO NOTHING;

-- Allow ANO/SUO to delete
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('Allow ANO/SUO to delete', 'files', 'DELETE', 'auth.uid() IS NOT NULL')
ON CONFLICT DO NOTHING;
