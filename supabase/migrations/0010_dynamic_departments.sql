CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER on_departments_updated
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert existing departments
INSERT INTO public.departments (code, name)
SELECT * FROM (VALUES
    ('ECE', 'Electronics and Communication'),
    ('CSE', 'Computer Science'),
    ('IT', 'Information Technology'),
    ('AIDS', 'Artificial Intelligence & Data Science'),
    ('AIML', 'Artificial Intelligence & Machine Learning'),
    ('RAA', 'Robotics and Automation'),
    ('MECH', 'Mechanical Engineering'),
    ('BME', 'Biomedical Engineering')
) AS v(code, name)
WHERE NOT EXISTS (
    SELECT 1 FROM public.departments d 
    WHERE d.code = v.code OR d.name = v.name
);

-- Drop CHECK constraint on profiles.department
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
    AND pg_get_constraintdef(oid) ILIKE '%department%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Add foreign key constraint to profiles.department referencing departments.code
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_department 
    FOREIGN KEY (department) REFERENCES public.departments(code) ON DELETE SET NULL;

-- Add foreign key constraint to courses.department referencing departments.code
ALTER TABLE public.courses
    ADD CONSTRAINT fk_courses_department 
    FOREIGN KEY (department) REFERENCES public.departments(code) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view departments
CREATE POLICY "Departments are viewable by everyone." 
    ON public.departments FOR SELECT USING (true);

-- Admins can insert departments
CREATE POLICY "Admins can insert departments." 
    ON public.departments FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update departments
CREATE POLICY "Admins can update departments." 
    ON public.departments FOR UPDATE USING (public.is_admin());

-- Admins can delete departments
CREATE POLICY "Admins can delete departments." 
    ON public.departments FOR DELETE USING (public.is_admin());
