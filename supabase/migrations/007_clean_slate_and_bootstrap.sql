-- ============================================================
-- 007: CLEAN SLATE & BOOTSTRAP
-- Run this in Supabase SQL Editor AFTER deploying the new code.
-- ============================================================
-- WARNING: This script will DELETE all user data (profiles,
-- attendance, notes, certificates, announcements, activity logs).
-- It preserves: units table, classes table structure.
-- ============================================================

-- ── 1. WIPE ALL USER-LINKED DATA ─────────────────────────────
-- Order matters: delete child records before parent records.

DELETE FROM activity_log;
DELETE FROM attendance;
DELETE FROM certificates;
DELETE FROM notes;
DELETE FROM announcements;
DELETE FROM profiles;

-- ── 2. WIPE ALL AUTH USERS ───────────────────────────────────
-- These have @nccrgu.internal emails that no longer match the code.
-- The new code uses @ncc.internal.

DELETE FROM auth.users;

-- ── 3. BOOTSTRAP FRESH ANO ACCOUNT ───────────────────────────
-- Creates an ANO user with:
--   Email:    ano_ano@ncc.internal
--   Password: 1234-ncc-auth  (PIN: 1234)
--
-- IMPORTANT: Change this PIN immediately after first login!

-- Insert into auth.users with a known password
-- The password hash below is for '1234-ncc-auth' using bcrypt.
-- We use Supabase's admin API pattern instead:

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'ano_ano@ncc.internal',
    crypt('1234-ncc-auth', gen_salt('bf')),
    NOW(),
    '{"full_name": "Associate NCC Officer", "role": "ANO"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
);

-- Create the matching profile
INSERT INTO profiles (id, full_name, role, unit_id, updated_at)
SELECT
    u.id,
    'Associate NCC Officer',
    'ANO',
    (SELECT id FROM units LIMIT 1),
    NOW()
FROM auth.users u
WHERE u.email = 'ano_ano@ncc.internal';

-- ── 4. VERIFY ────────────────────────────────────────────────
-- Run these queries to confirm everything is clean:

-- Should return 1 row (the new ANO)
SELECT id, email, raw_user_meta_data->>'role' as role FROM auth.users;

-- Should return 1 row (the ANO profile)
SELECT id, full_name, role, unit_id FROM profiles;

-- Should return 0 rows each
SELECT COUNT(*) as attendance_count FROM attendance;
SELECT COUNT(*) as notes_count FROM notes;
SELECT COUNT(*) as certificates_count FROM certificates;

-- Should return your unit (preserved!)
SELECT id, name, number FROM units;
