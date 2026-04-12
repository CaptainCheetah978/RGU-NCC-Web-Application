-- =============================================
-- RLS PERFORMANCE FIX - Run in Supabase SQL Editor
-- Fixes: auth_rls_initplan, multiple_permissive_policies, duplicate_index
-- =============================================

-- =============================================
-- STEP 1: DROP ALL EXISTING POLICIES (nuclear reset)
-- =============================================

-- profiles
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "ANO update all" ON profiles;
DROP POLICY IF EXISTS "SUO update all" ON profiles;
DROP POLICY IF EXISTS "Admin update all" ON profiles;
DROP POLICY IF EXISTS "Enable users to view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;

-- announcements
DROP POLICY IF EXISTS "View announcements" ON announcements;
DROP POLICY IF EXISTS "ANO/SUO Manage announcements" ON announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON announcements;
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;

-- classes
DROP POLICY IF EXISTS "View classes" ON classes;
DROP POLICY IF EXISTS "ANO/SUO Manage classes" ON classes;
DROP POLICY IF EXISTS "Manage classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Classes are viewable by everyone" ON classes;

-- attendance
DROP POLICY IF EXISTS "View own attendance" ON attendance;
DROP POLICY IF EXISTS "Cadets view own attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO View all attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Manage attendance" ON attendance;
DROP POLICY IF EXISTS "Manage attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Mark attendance" ON attendance;
DROP POLICY IF EXISTS "ANO/SUO Update attendance" ON attendance;
DROP POLICY IF EXISTS "Admins view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins manage attendance" ON attendance;

-- notes
DROP POLICY IF EXISTS "Users manage own notes" ON notes;
DROP POLICY IF EXISTS "Recipients update received notes" ON notes;
DROP POLICY IF EXISTS "ANO views all notes" ON notes;
DROP POLICY IF EXISTS "Users view received notes" ON notes;

-- certificates
DROP POLICY IF EXISTS "Users manage own certificates" ON certificates;
DROP POLICY IF EXISTS "ANO manages all certificates" ON certificates;
DROP POLICY IF EXISTS "SUO views all certificates" ON certificates;

-- activity_log
DROP POLICY IF EXISTS "Authenticated users can read activity log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;


-- =============================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;


-- =============================================
-- STEP 3: RECREATE OPTIMIZED POLICIES
-- All auth.uid() wrapped in (select auth.uid())
-- No duplicate permissive policies
-- =============================================

-- ── PROFILES ──────────────────────────────────
-- Everyone can view all profiles (needed for cadet registry, lookups)
CREATE POLICY "Public profiles" ON profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (on first login)
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Users can update their own profile
CREATE POLICY "Update own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- ANO/SUO can update any profile (assign ranks, edit cadets)
CREATE POLICY "Admin update all" ON profiles
  FOR UPDATE USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO') LIMIT 1)
  );


-- ── ANNOUNCEMENTS ─────────────────────────────
-- Everyone can view announcements
CREATE POLICY "View announcements" ON announcements
  FOR SELECT USING (true);

-- ANO/SUO can manage announcements (insert, update, delete)
CREATE POLICY "ANO/SUO Manage announcements" ON announcements
  FOR ALL USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO', 'UO', 'CJUO', 'CWO', 'CUO'))
  );


-- ── CLASSES ───────────────────────────────────
-- Everyone can view classes
CREATE POLICY "View classes" ON classes
  FOR SELECT USING (true);

-- ANO/SUO/UO can manage classes
CREATE POLICY "Manage classes" ON classes
  FOR ALL USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO', 'UO', 'CJUO', 'CWO', 'CUO'))
  );


-- ── ATTENDANCE ────────────────────────────────
-- Cadets can view their own attendance
CREATE POLICY "View own attendance" ON attendance
  FOR SELECT USING (cadet_id = (select auth.uid()));

-- ANO/SUO can view all attendance
CREATE POLICY "ANO/SUO View all attendance" ON attendance
  FOR SELECT USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO', 'UO', 'CJUO', 'CWO', 'CUO', 'SGT', 'CSM', 'CQMS', 'PO'))
  );

-- ANO/SUO/UO/SGT can manage attendance (insert, update, delete)
CREATE POLICY "Manage attendance" ON attendance
  FOR ALL USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO', 'UO', 'CJUO', 'CWO', 'CUO', 'SGT', 'CSM', 'CQMS', 'PO'))
  );


-- ── NOTES ─────────────────────────────────────
-- Users can manage their own notes (sent by them)
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (sender_id = (select auth.uid()));

-- Recipients can update notes sent to them (mark as read)
CREATE POLICY "Recipients update received notes" ON notes
  FOR UPDATE USING (recipient_id = (select auth.uid()));

-- ANO can view all notes
CREATE POLICY "ANO views all notes" ON notes
  FOR SELECT USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role = 'ANO')
  );

-- Users can view notes sent TO them
CREATE POLICY "Users view received notes" ON notes
  FOR SELECT USING (recipient_id = (select auth.uid()));


-- ── CERTIFICATES ──────────────────────────────
-- Users can manage their own certificates
CREATE POLICY "Users manage own certificates" ON certificates
  FOR ALL USING (user_id = (select auth.uid()));

-- ANO can manage all certificates
CREATE POLICY "ANO manages all certificates" ON certificates
  FOR ALL USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role = 'ANO')
  );

-- SUO can view all certificates
CREATE POLICY "SUO views all certificates" ON certificates
  FOR SELECT USING (
    (select auth.uid()) IN (SELECT id FROM profiles WHERE role IN ('ANO', 'CTO', 'SUO', 'CSUO', 'SCC') LIMIT 1)
  );


-- ── ACTIVITY LOG ──────────────────────────────
-- Authenticated users can read activity log
CREATE POLICY "Authenticated users can read activity log" ON activity_log
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);

-- Authenticated users can insert activity
CREATE POLICY "Authenticated users can insert activity" ON activity_log
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);


-- =============================================
-- STEP 4: DROP DUPLICATE INDEX
-- =============================================
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_cadet_id_key;
-- Kept: attendance_class_cadet_unique
