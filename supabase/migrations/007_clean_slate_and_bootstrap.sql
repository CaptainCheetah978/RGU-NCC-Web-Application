-- ============================================================
-- 007: CLEAN SLATE & BOOTSTRAP (Trigger-Safe Version)
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

-- A. Insert into auth.users (Authentication)
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

-- B. Sync with Profiles Table (Application)
-- Path 1: Update the profile if a database trigger already created it
UPDATE profiles 
SET 
    full_name = 'Associate NCC Officer',
    role = 'ANO',
    unit_id = (SELECT id FROM units LIMIT 1),
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'ano_ano@ncc.internal');

-- Path 2: Manual insert ONLY if no trigger exists
INSERT INTO profiles (id, full_name, role, unit_id, updated_at)
SELECT
    u.id,
    'Associate NCC Officer',
    'ANO',
    (SELECT id FROM units LIMIT 1),
    NOW()
FROM auth.users u
WHERE u.email = 'ano_ano@ncc.internal'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- ── 4. VERIFY ────────────────────────────────────────────────
-- Highlight and run these individually if the editor only shows one result:

-- SELECT * FROM auth.users;
-- SELECT * FROM profiles;
-- SELECT COUNT(*) as attendance_count FROM attendance;
