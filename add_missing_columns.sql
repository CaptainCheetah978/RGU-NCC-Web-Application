-- Add missing columns to 'profiles' table safely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regimental_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wing TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrollment_year INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_pin TEXT;

-- Verify columns exist (optional, just for confirmation if run in editor)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
