-- Security hardening:
-- - remove unrestricted profile, certificate, and activity-log reads
-- - prevent direct client-side profile role/unit escalation
-- Server actions still apply the finer-grained application authorization rules.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_unit_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
DROP POLICY IF EXISTS "ANO update all" ON profiles;
DROP POLICY IF EXISTS "SUO update all" ON profiles;
DROP POLICY IF EXISTS "Admin update all" ON profiles;

CREATE POLICY "Users view own or authorized unit profiles" ON profiles
  FOR SELECT USING (
    id = (select auth.uid())
    OR (
      public.current_profile_role() IN ('ANO', 'CTO', 'CSUO', 'CJUO', 'CWO', 'CSM', 'CQMS', 'SGT')
      AND (
        public.current_profile_unit_id() IS NULL
        OR unit_id = public.current_profile_unit_id()
      )
    )
  );

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "ANO updates profiles" ON profiles
  FOR UPDATE USING (
    public.current_profile_role() = 'ANO'
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own certificates" ON certificates;
DROP POLICY IF EXISTS "ANO manages all certificates" ON certificates;
DROP POLICY IF EXISTS "SUO views all certificates" ON certificates;

CREATE POLICY "Users manage own certificates" ON certificates
  FOR ALL USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Authorized staff view unit certificates" ON certificates
  FOR SELECT USING (
    public.current_profile_role() IN ('ANO', 'CTO', 'CSUO', 'CJUO', 'CWO', 'CSM', 'CQMS', 'SGT')
    AND (
      public.current_profile_unit_id() IS NULL
      OR unit_id = public.current_profile_unit_id()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read activity log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_log;

CREATE POLICY "ANO and CTO view unit activity log" ON activity_log
  FOR SELECT USING (
    public.current_profile_role() IN ('ANO', 'CTO')
    AND (
      public.current_profile_unit_id() IS NULL
      OR unit_id = public.current_profile_unit_id()
    )
  );

CREATE POLICY "Users insert own activity" ON activity_log
  FOR INSERT WITH CHECK (performed_by = (select auth.uid()));
