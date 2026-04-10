-- ============================================================
-- 004_MULTI_TENANCY: Initial Data Partitioning
-- ============================================================

-- 1. Create Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert Default Unit (for backward compatibility)
INSERT INTO units (name, number)
VALUES ('30 Assam Bn NCC', '30')
ON CONFLICT (name) DO NOTHING;

-- 3. Add unit_id to all relevant tables
DO $$
DECLARE
    default_unit_id UUID;
BEGIN
    SELECT id INTO default_unit_id FROM units LIMIT 1;

    -- profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='unit_id') THEN
        ALTER TABLE profiles ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE profiles SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- classes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='unit_id') THEN
        ALTER TABLE classes ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE classes SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- attendance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='unit_id') THEN
        ALTER TABLE attendance ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE attendance SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='unit_id') THEN
        ALTER TABLE notes ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE notes SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- announcements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='announcements' AND column_name='unit_id') THEN
        ALTER TABLE announcements ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE announcements SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- certificates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='certificates' AND column_name='unit_id') THEN
        ALTER TABLE certificates ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE certificates SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;

    -- activity_log
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='unit_id') THEN
        ALTER TABLE activity_log ADD COLUMN unit_id UUID REFERENCES units(id);
        UPDATE activity_log SET unit_id = default_unit_id WHERE unit_id IS NULL;
    END IF;
END $$;

-- 4. Update RLS Policies to Partition by unit_id
-- We drop and recreate the sensitive ones.

-- Helper function to get current user's unit_id (prevents repetitive subqueries)
CREATE OR REPLACE FUNCTION get_my_unit_id()
RETURNS UUID AS $$
    SELECT unit_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Re-partition Classes
DROP POLICY IF EXISTS "View classes" ON classes;
CREATE POLICY "View classes" ON classes
    FOR SELECT USING (unit_id = get_my_unit_id());

DROP POLICY IF EXISTS "Manage classes" ON classes;
CREATE POLICY "Manage classes" ON classes
    FOR ALL USING (
        unit_id = get_my_unit_id() AND
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ANO', 'SUO', 'UO')
    );

-- Re-partition Attendance
DROP POLICY IF EXISTS "View own attendance" ON attendance;
CREATE POLICY "View own attendance" ON attendance
    FOR SELECT USING (cadet_id = auth.uid());

DROP POLICY IF EXISTS "ANO/SUO View all attendance" ON attendance;
CREATE POLICY "ANO/SUO View all attendance" ON attendance
    FOR SELECT USING (
        unit_id = get_my_unit_id() AND
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ANO', 'SUO', 'UO', 'SGT')
    );

DROP POLICY IF EXISTS "Manage attendance" ON attendance;
CREATE POLICY "Manage attendance" ON attendance
    FOR ALL USING (
        unit_id = get_my_unit_id() AND
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ANO', 'SUO', 'UO', 'SGT')
    );

-- Re-partition Announcements
DROP POLICY IF EXISTS "View announcements" ON announcements;
CREATE POLICY "View announcements" ON announcements
    FOR SELECT USING (unit_id = get_my_unit_id());

DROP POLICY IF EXISTS "ANO/SUO Manage announcements" ON announcements;
CREATE POLICY "ANO/SUO Manage announcements" ON announcements
    FOR ALL USING (
        unit_id = get_my_unit_id() AND
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ANO', 'SUO')
    );

-- Partition Profiles (Users can see everyone in their UNIT)
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Unit profiles" ON profiles;
CREATE POLICY "Unit profiles" ON profiles
    FOR SELECT USING (unit_id = get_my_unit_id());
