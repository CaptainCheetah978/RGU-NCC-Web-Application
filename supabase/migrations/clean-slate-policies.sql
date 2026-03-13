-- CLEAN SLATE PROTOCOL
-- 1. Drop ALL existing policies to remove recursion/conflicts
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "ANO update all" ON profiles;
DROP POLICY IF EXISTS "SUO update all" ON profiles;
DROP POLICY IF EXISTS "Admin update all" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "View announcements" ON announcements;
DROP POLICY IF EXISTS "ANO/SUO Manage announcements" ON announcements;
DROP POLICY IF EXISTS "View classes" ON classes;
DROP POLICY IF EXISTS "ANO/SUO Manage classes" ON classes;
DROP POLICY IF EXISTS "Manage classes" ON classes;
DROP POLICY IF EXISTS "View own attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO View all attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Manage attendance" ON attendance;
DROP POLICY IF EXISTS "Manage attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Mark attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Update attendance" ON attendance;
DROP POLICY IF EXISTS "Users manage own notes" ON notes;
DROP POLICY IF EXISTS "Recipients update received notes" ON notes;
DROP POLICY IF EXISTS "ANO views all notes" ON notes;
DROP POLICY IF EXISTS "Users view received notes" ON notes;

-- 2. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 3. Re-create Safe Policies

-- PROFILES
-- Safe: Everyone can see everyone (needed for lists/lookups)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
-- Safe: User can update own
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Safe: ANO/SUO can update all.
-- CRITICAL: Prevent recursion. This policy queries 'profiles'. 
-- But since 'Public profiles' allows SELECT (true), this subquery matches 'true', NO recursion.
CREATE POLICY "Admin update all" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
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
-- Safe: ANO/SUO/UO manage
CREATE POLICY "Manage classes" ON classes FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO'))
);

-- ATTENDANCE
-- Safe: See own
CREATE POLICY "View own attendance" ON attendance FOR SELECT USING (cadet_id = auth.uid());
-- Safe: ANO/SUO/UO/SGT see all
CREATE POLICY "ANO/SUO View all attendance" ON attendance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO', 'SGT'))
);
-- Safe: ANO/SUO/UO/SGT mark/update
CREATE POLICY "Manage attendance" ON attendance FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO', 'SGT'))
);

-- NOTES
-- Users can manage their own notes (sent by them)
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (sender_id = auth.uid());
-- Recipients can update notes sent to them (mark as read)
CREATE POLICY "Recipients update received notes" ON notes FOR UPDATE USING (recipient_id = auth.uid());
-- ANO can view all notes
CREATE POLICY "ANO views all notes" ON notes FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'ANO')
);
-- Users can view notes sent TO them
CREATE POLICY "Users view received notes" ON notes FOR SELECT USING (recipient_id = auth.uid());
