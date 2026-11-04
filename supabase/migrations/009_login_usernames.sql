-- Short, immutable login aliases. Registration numbers and profile IDs remain
-- the source of truth for attendance, messaging, cards, and verification.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS login_username TEXT;

UPDATE public.profiles
SET login_username = 'C' || right(regexp_replace(regimental_number, '\D', '', 'g'), 4)
WHERE login_username IS NULL
  AND regimental_number IS NOT NULL
  AND length(regexp_replace(regimental_number, '\D', '', 'g')) >= 4;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_username_key
ON public.profiles (upper(btrim(login_username)))
WHERE login_username IS NOT NULL
  AND btrim(login_username) <> '';
