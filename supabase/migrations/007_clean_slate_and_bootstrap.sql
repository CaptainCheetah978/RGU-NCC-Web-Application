-- ============================================================
-- 007: CLEAN SLATE & BOOTSTRAP (Trigger-Safe & Identity-Linked)
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
DELETE FROM auth.users;

-- ── 3. BOOTSTRAP FRESH ANO ACCOUNT ───────────────────────────
-- Email:    ano_ano@ncc.internal
-- Password: 1234-ncc-auth  (PIN: 1234)

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- A. The User Record (Authentication)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_user_meta_data, role, aud, created_at, updated_at
    ) VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', 
        'ano_ano@ncc.internal', crypt('1234-ncc-auth', gen_salt('bf')), 
        NOW(), '{"full_name": "Associate NCC Officer", "role": "ANO"}'::jsonb, 
        'authenticated', 'authenticated', NOW(), NOW()
    );

    -- B. The Identity Record (Critical for Auth API stability)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
    ) VALUES (
        new_user_id, new_user_id, 
        format('{"sub":"%s","email":"%s"}', new_user_id, 'ano_ano@ncc.internal')::jsonb, 
        'email', NOW(), NOW(), NOW(), 'ano_ano@ncc.internal'
    );

    -- C. The Application Profile (Trigger-Safe Upsert)
    INSERT INTO public.profiles (id, full_name, role, unit_id, updated_at)
    VALUES (
        new_user_id, 'Associate NCC Officer', 'ANO', 
        (SELECT id FROM public.units LIMIT 1), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        unit_id = EXCLUDED.unit_id,
        updated_at = EXCLUDED.updated_at;
END $$;

-- ── 4. VERIFY ────────────────────────────────────────────────
-- SELECT * FROM auth.users;
-- SELECT * FROM profiles;
-- SELECT COUNT(*) as attendance_count FROM attendance;
