-- ============================================================
-- 005_FIX_UNIT_RECURSION_AND_SCHEMA
-- This script bridges the gap between the codebase and the DB.
-- It ensures unit_id exists and fixes the RLS infinite loop.
-- ============================================================

-- ── 1. SCHEMA RESTORATION (Multi-Unit Foundation) ──────
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default battalion
INSERT INTO units (name, number) 
VALUES ('30 Assam Bn NCC', '30') 
ON CONFLICT (name) DO NOTHING;

-- Add unit_id columns securely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);

-- ── 2. DATA CALIBRATION (Bypassing the Lock) ───────────
-- Disable the 7-day lock temporarily to allow legacy data migration
ALTER TABLE attendance DISABLE TRIGGER lock_old_attendance;

-- Populate all old data with the default unit (30 Assam Bn)
UPDATE profiles SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;
UPDATE classes SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;
UPDATE attendance SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;
UPDATE announcements SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;

-- Re-enable the 7-day lock
ALTER TABLE attendance ENABLE TRIGGER lock_old_attendance;

-- ── 3. SECURITY LOCKDOWN (Nuclear Cleanup) ───────────
-- This ensures no "already exists" errors when re-running
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Isolated Profiles" ON profiles;
DROP POLICY IF EXISTS "Self view profiles" ON profiles;
DROP POLICY IF EXISTS "Unit profiles" ON profiles;
DROP POLICY IF EXISTS "ANO global view" ON profiles; 
DROP POLICY IF EXISTS "Isolated Classes" ON classes;
DROP POLICY IF EXISTS "View classes" ON classes;
DROP POLICY IF EXISTS "Isolated Announcements" ON announcements;
DROP POLICY IF EXISTS "View announcements" ON announcements;
DROP POLICY IF EXISTS "Admin Class Management" ON classes;
DROP POLICY IF EXISTS "Manage classes" ON classes;

-- ── 4. RE-ESTABLISH ISOLATION (Recursion-Free) ────────
-- A. The Direct Path: Users can ALWAYS see themselves (Breaks the recursion index)
CREATE POLICY "Self view profiles" ON profiles
    FOR SELECT USING (id = auth.uid());

-- B. The Unit Path: Users can see others in their own unit
CREATE POLICY "Unit profiles" ON profiles
    FOR SELECT USING (
      unit_id IS NOT NULL AND 
      unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1)
    );

-- C. The ANO Path: ANOs can see everyone globally
CREATE POLICY "ANO global view" ON profiles
    FOR SELECT USING (
        (SELECT p.role FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1) = 'ANO'
    );

-- D. Isolated Classes & Announcements
CREATE POLICY "Isolated Classes" ON classes 
FOR SELECT USING (unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1));

CREATE POLICY "Isolated Announcements" ON announcements 
FOR SELECT USING (unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1));

-- E. Admin Class Management
CREATE POLICY "Admin Class Management" ON classes
  FOR ALL 
  USING (
    unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1) AND
    (SELECT p.role FROM profiles p WHERE p.id = (select auth.uid()) LIMIT 1) IN ('ANO', 'CTO', 'CSUO', 'CJUO', 'CWO', 'CUO')
  );

-- ── 5. FINAL PIN DELETE ───────────────────────────────
-- Permanently delete the plaintext PIN column (Supabase Auth uses hashed PINs now)
ALTER TABLE profiles DROP COLUMN IF EXISTS access_pin;
