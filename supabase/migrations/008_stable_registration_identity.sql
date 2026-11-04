-- Registration numbers are the durable identity for non-ANO accounts.
-- Apply after resolving any existing duplicate registration numbers.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_regimental_number_normalized_key
ON public.profiles (
    lower(regexp_replace(btrim(regimental_number), '\s+', '', 'g'))
)
WHERE regimental_number IS NOT NULL
  AND btrim(regimental_number) <> '';
