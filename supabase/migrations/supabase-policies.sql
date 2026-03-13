-- Enable RLS on tables (just to be safe/sure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES (Cadet Registry & User Profiles)
-- Allow everyone to view profiles (so lists load)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
-- Allow users to update their own profile
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Allow ANO/SUO to update ANY profile (edit cadets, assign ranks)
CREATE POLICY "Admin update all" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);

-- 2. ANNOUNCEMENTS (News Feed)
-- Everyone can read
CREATE POLICY "View announcements" ON announcements FOR SELECT USING (true);
-- ANO and SUO can insert/delete
CREATE POLICY "ANO/SUO Manage announcements" ON announcements FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);

-- 3. CLASSES (Schedule)
-- Everyone can read
CREATE POLICY "View classes" ON classes FOR SELECT USING (true);
-- ANO/SUO/UO can manage
CREATE POLICY "Manage classes" ON classes FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO'))
);

-- 4. ATTENDANCE
-- Everyone can read their own
CREATE POLICY "View own attendance" ON attendance FOR SELECT USING (cadet_id = auth.uid());
-- ANO/SUO/UO/SGT can view all
CREATE POLICY "ANO/SUO View all attendance" ON attendance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO', 'SGT'))
);
-- ANO/SUO/UO/SGT can manage attendance
CREATE POLICY "Manage attendance" ON attendance FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO', 'UO', 'SGT'))
);

-- 5. NOTES
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
