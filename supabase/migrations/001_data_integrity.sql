-- ============================================================
-- Data Integrity Migration for NCC RGU App
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Unique constraint: prevent duplicate attendance entries ────────────────
-- A cadet can only have one attendance record per class session.
-- The code already checks before inserting, but this DB constraint is the
-- safety net that makes it impossible even if the code has a race condition.

ALTER TABLE attendance
    DROP CONSTRAINT IF EXISTS attendance_class_cadet_unique;

ALTER TABLE attendance
    ADD CONSTRAINT attendance_class_cadet_unique
    UNIQUE (class_id, cadet_id);


-- ── 2. Foreign key cascade deletes ───────────────────────────────────────────
-- When a class is deleted, remove its attendance records automatically.
-- When a profile is deleted, remove their attendance, notes, and certificates.
-- This backs up the code-side cascade deletes in data-context.tsx.

-- attendance → classes (cascade on class delete)
ALTER TABLE attendance
    DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE attendance
    ADD CONSTRAINT attendance_class_id_fkey
    FOREIGN KEY (class_id)
    REFERENCES classes(id)
    ON DELETE CASCADE;

-- attendance → profiles (cascade on cadet/profile delete)
ALTER TABLE attendance
    DROP CONSTRAINT IF EXISTS attendance_cadet_id_fkey;
ALTER TABLE attendance
    ADD CONSTRAINT attendance_cadet_id_fkey
    FOREIGN KEY (cadet_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- notes → profiles (nullify sender/recipient on profile delete)
ALTER TABLE notes
    DROP CONSTRAINT IF EXISTS notes_sender_id_fkey;
ALTER TABLE notes
    ADD CONSTRAINT notes_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

ALTER TABLE notes
    DROP CONSTRAINT IF EXISTS notes_recipient_id_fkey;
ALTER TABLE notes
    ADD CONSTRAINT notes_recipient_id_fkey
    FOREIGN KEY (recipient_id)
    REFERENCES profiles(id)
    ON DELETE SET NULL;

-- certificates → profiles (cascade on profile delete)
ALTER TABLE certificates
    DROP CONSTRAINT IF EXISTS certificates_user_id_fkey;
ALTER TABLE certificates
    ADD CONSTRAINT certificates_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;


-- ── 3. Historical lock on attendance records ──────────────────────────────────
-- Attendance records older than 7 days cannot be updated.
-- This prevents accidental or unauthorized retroactive edits.

CREATE OR REPLACE FUNCTION prevent_old_attendance_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.created_at < NOW() - INTERVAL '7 days' THEN
        RAISE EXCEPTION 'Cannot modify attendance records older than 7 days.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lock_old_attendance ON attendance;
CREATE TRIGGER lock_old_attendance
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION prevent_old_attendance_update();


-- ── 4. RLS check: ensure attendance table has RLS enabled ────────────────────
-- (RLS should already be on, but this is a reminder to verify in the dashboard)
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
