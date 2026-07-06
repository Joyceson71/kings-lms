-- Add new columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department TEXT CHECK (department IN ('ECE', 'CSE', 'IT', 'AIDS', 'AIML', 'RAA', 'MECH', 'BME')),
ADD COLUMN IF NOT EXISTS year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS college TEXT DEFAULT 'Kings Engineering College',
ADD COLUMN IF NOT EXISTS roll_number TEXT;

-- Update the handle_new_user function to extract these from meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    department,
    year_of_study,
    college,
    roll_number
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'department',
    CAST(NULLIF(NEW.raw_user_meta_data->>'year', '') AS INTEGER),
    COALESCE(NEW.raw_user_meta_data->>'college', 'Kings Engineering College'),
    NEW.raw_user_meta_data->>'roll_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
