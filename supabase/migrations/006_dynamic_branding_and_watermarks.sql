-- ============================================================
-- 006_DYNAMIC_BRANDING_AND_WATERMARKS
-- ============================================================

-- 1. Expand units table with branding columns
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS secondary_logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- 2. Update existing default unit with generic placeholders
-- (The user will run a private SQL command to restore their RGU branding)
UPDATE units 
SET 
    name = '30 Assam Bn NCC (your unit name here)',
    institution_name = '(your institution name here)',
    logo_url = '/ncc-logo.png',
    secondary_logo_url = '/rgu-logo.png',
    primary_color = '#2563eb'
WHERE name = '30 Assam Bn NCC';

-- 3. Ensure unit_id is properly handled in RLS for units table itself
-- Users should be able to view their own unit's branding
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Units are viewable by everyone" ON units;
CREATE POLICY "Units are viewable by everyone" 
ON units FOR SELECT 
USING (true);

-- Only superadmins/ANO can update branding (ANO check via profiles)
DROP POLICY IF EXISTS "ANO Manage unit branding" ON units;
CREATE POLICY "ANO Manage unit branding" 
ON units FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'ANO'
    )
);
