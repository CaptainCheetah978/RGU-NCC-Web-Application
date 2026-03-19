-- SQL Migration: Delete Demo Cadets
-- ------------------------------------------------------------
-- Objective: Safely remove all placeholder data created during 
-- development and demonstration phases.
-- ------------------------------------------------------------

-- 1. Identify and delete profiles with 'DEMO', 'TEST', or 'DE-MO' identifiers.
-- Foreign Key CASCADE constraints (established in 001_data_integrity.sql) 
-- will automatically clean up:
--   - attendance records
--   - certificates
--   - activity log entries
--   - communication notes

DELETE FROM profiles 
WHERE 
  full_name ILIKE '%DEMO%' 
  OR full_name ILIKE '%TEST%' 
  OR reg_no ILIKE '%DE-MO%' 
  OR reg_no ILIKE '%TEST%';

-- 2. Verify deletion of any orphaned records (Safety Check)
DELETE FROM attendance WHERE profile_id IS NULL;
DELETE FROM certificates WHERE profile_id IS NULL;

COMMIT;
