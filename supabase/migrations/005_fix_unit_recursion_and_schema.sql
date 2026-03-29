-- ============================================================
-- 005_FIX_UNIT_RECURSION_AND_SCHEMA
-- This script bridges the gap between the codebase and the DB.
-- It ensures unit_id exists and fixes the RLS infinite loop.
-- ============================================================

-- 1. Create the Units table if it doesn't exist
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert the default battalion unit
INSERT INTO units (name, number)
VALUES ('30 Assam Bn NCC', '30')
ON CONFLICT (name) DO NOTHING;

-- 3. Add the unit_id column to profiles securely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='unit_id') THEN
        ALTER TABLE profiles ADD COLUMN unit_id UUID REFERENCES units(id);
    END IF;
END $$;

-- 4. Assign all existing profiles to the first available unit (Prevents lockout)
UPDATE profiles SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;

-- 5. RE-STRUCTURE RLS POLICIES (Bypass Recursion)
-- We drop the old ones to be 100% clean.
DROP POLICY IF EXISTS "Unit profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Self view profiles" ON profiles;

-- A. The Direct Path: Users can ALWAYS see themselves (breaks the recursion)
CREATE POLICY "Self view profiles" ON profiles
    FOR SELECT USING (id = auth.uid());

-- B. The Unit Path: Users can see others in their own unit
CREATE POLICY "Unit profiles" ON profiles
    FOR SELECT USING (
      unit_id IS NOT NULL AND 
      unit_id = (SELECT p.unit_id FROM profiles p WHERE p.id = auth.uid())
    );

-- 6. Ensure unit_id is added to other critical tables if missing
-- (Classes)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='unit_id') THEN
        ALTER TABLE classes ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE classes SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;
    END IF;
END $$;
-- (Attendance)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='unit_id') THEN
        ALTER TABLE attendance ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE attendance SET unit_id = (SELECT id FROM units LIMIT 1) WHERE unit_id IS NULL;
    END IF;
END $$;
