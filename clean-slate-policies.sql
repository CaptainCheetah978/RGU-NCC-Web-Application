-- CLEAN SLATE PROTOCOL
-- 1. Drop ALL existing policies to remove recursion/conflicts
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "ANO update all" ON profiles;
DROP POLICY IF EXISTS "View announcements" ON announcements;
DROP POLICY IF EXISTS "ANO/SUO Manage announcements" ON announcements;
DROP POLICY IF EXISTS "View classes" ON classes;
DROP POLICY IF EXISTS "ANO/SUO Manage classes" ON classes;
DROP POLICY IF EXISTS "View own attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO View all attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Mark attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Update attendance" ON attendance;

-- 2. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 3. Re-create Safe Policies

-- PROFILES
-- Safe: Everyone can see everyone (needed for lists/lookups)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
-- Safe: User can update own
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Safe: ANO can update all. 
-- CRITICAL: Prevent recursion. This policy queries 'profiles'. 
-- But since 'Public profiles' allows SELECT (true), this subquery matches 'true', NO recursion.
CREATE POLICY "ANO update all" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'ANO')
);

-- ANNOUNCEMENTS
-- Safe: Everyone sees
CREATE POLICY "View announcements" ON announcements FOR SELECT USING (true);
-- Safe: ANO/SUO insert/update/delete
CREATE POLICY "ANO/SUO Manage announcements" ON announcements FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);

-- CLASSES
-- Safe: Everyone sees
CREATE POLICY "View classes" ON classes FOR SELECT USING (true);
-- Safe: ANO/SUO manage
CREATE POLICY "ANO/SUO Manage classes" ON classes FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);

-- ATTENDANCE
-- Safe: See own
CREATE POLICY "View own attendance" ON attendance FOR SELECT USING (cadet_id = auth.uid());
-- Safe: ANO/SUO see all
CREATE POLICY "ANO/SUO View all attendance" ON attendance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);
-- Safe: ANO/SUO mark/update
CREATE POLICY "ANO/SUO Manage attendance" ON attendance FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);
