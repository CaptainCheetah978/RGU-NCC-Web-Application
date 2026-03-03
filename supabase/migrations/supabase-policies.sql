-- Enable RLS on tables (just to be safe/sure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES (Cadet Registry & User Profiles)
-- Allow everyone to view profiles (so lists load)
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
-- Allow users to update their own profile
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Allow ANO to update ANY profile (for assigning ranks, PINs, etc)
-- Assuming we can't easily check "role" inside the policy without recursion, 
-- we might rely on the frontend or a refined policy. 
-- For simplicity/robustness now, let's allow Update if the user claims to be ANO in metadata 
-- OR just rely on the Service Role (which my new Server Actions use!).
-- WAIT! The Client-side `updateCadet` uses the anon client. It NEEDS this policy.
CREATE POLICY "ANO update all" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'ANO')
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
-- ANO/SUO can manage
CREATE POLICY "ANO/SUO Manage classes" ON classes FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);

-- 4. ATTENDANCE
-- Everyone can read their own
CREATE POLICY "View own attendance" ON attendance FOR SELECT USING (cadet_id = auth.uid());
-- ANO/SUO can view all
CREATE POLICY "ANO/SUO View all attendance" ON attendance FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);
-- ANO/SUO can mark attendance
CREATE POLICY "ANO/SUO Mark attendance" ON attendance FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);
CREATE POLICY "ANO/SUO Update attendance" ON attendance FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ANO', 'SUO'))
);
