-- Add theme column to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system'));
