-- 002_alumni_status.sql
-- Adds an operational status to cadets to allow archiving without deletion

-- 1. Create a custom ENUM type for status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cadet_status') THEN
        CREATE TYPE cadet_status AS ENUM ('active', 'alumni');
    END IF;
END $$;

-- 2. Add the status column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status cadet_status NOT NULL DEFAULT 'active';

-- 3. Create an index for faster filtering of active vs alumni cadets
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
