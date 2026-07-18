ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email addresses for existing users from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
