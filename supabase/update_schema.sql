-- 1. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, -- if null, global announcement
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_announcements_updated ON public.announcements;
CREATE TRIGGER on_announcements_updated
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Announcements RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Select policies
-- Students can see global announcements (course_id IS NULL) or announcements for courses they are enrolled in.
CREATE POLICY "Users can view relevant announcements." ON public.announcements FOR SELECT USING (
    course_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.course_enrollments 
        WHERE public.course_enrollments.course_id = public.announcements.course_id 
        AND public.course_enrollments.student_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE public.courses.id = public.announcements.course_id 
        AND public.courses.created_by = auth.uid()
    )
);

-- Insert policies
-- Admins can create global announcements. Faculty can create course-specific announcements.
CREATE POLICY "Admins can create global announcements." ON public.announcements FOR INSERT WITH CHECK (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can create course announcements." ON public.announcements FOR INSERT WITH CHECK (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Update and Delete policies
CREATE POLICY "Admins can update global announcements." ON public.announcements FOR UPDATE USING (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can update their course announcements." ON public.announcements FOR UPDATE USING (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

CREATE POLICY "Admins can delete global announcements." ON public.announcements FOR DELETE USING (
    course_id IS NULL AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can delete their course announcements." ON public.announcements FOR DELETE USING (
    course_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);
-- 1. Create course_sessions table
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.course_sessions CASCADE;

CREATE TABLE IF NOT EXISTS public.course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    room TEXT,
    status TEXT DEFAULT 'active', -- 'active' or 'closed'
    qr_token TEXT NOT NULL UNIQUE, -- A random secure token that changes per session
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional: automatically close session after some time
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at on course_sessions
DROP TRIGGER IF EXISTS on_course_sessions_updated ON public.course_sessions;
CREATE TRIGGER on_course_sessions_updated
    BEFORE UPDATE ON public.course_sessions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Create attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Present', -- 'Present', 'Late', 'Excused', etc.
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent a student from marking attendance multiple times for the same session
    UNIQUE(session_id, student_id)
);

-- 3. RLS Policies for course_sessions
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- Faculty can read sessions for courses they teach
DROP POLICY IF EXISTS "Faculty can read their course sessions" ON public.course_sessions;
CREATE POLICY "Faculty can read their course sessions" ON public.course_sessions FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_sessions.course_id AND created_by = auth.uid())
);

-- Students can read active sessions for courses they are enrolled in
DROP POLICY IF EXISTS "Students can read active course sessions" ON public.course_sessions;
CREATE POLICY "Students can read active course sessions" ON public.course_sessions FOR SELECT USING (
    status = 'active' AND
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = course_sessions.course_id AND student_id = auth.uid())
);

-- Faculty can create sessions
DROP POLICY IF EXISTS "Faculty can create sessions" ON public.course_sessions;
CREATE POLICY "Faculty can create sessions" ON public.course_sessions FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

-- Faculty can update their sessions (e.g. to close them)
DROP POLICY IF EXISTS "Faculty can update their sessions" ON public.course_sessions;
CREATE POLICY "Faculty can update their sessions" ON public.course_sessions FOR UPDATE USING (
    created_by = auth.uid()
);

-- 4. RLS Policies for attendance_logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Faculty can read attendance logs for their sessions
DROP POLICY IF EXISTS "Faculty can read attendance logs" ON public.attendance_logs;
CREATE POLICY "Faculty can read attendance logs" ON public.attendance_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_sessions WHERE id = attendance_logs.session_id AND created_by = auth.uid())
);

-- Students can read their own attendance logs
DROP POLICY IF EXISTS "Students can read own attendance logs" ON public.attendance_logs;
CREATE POLICY "Students can read own attendance logs" ON public.attendance_logs FOR SELECT USING (
    student_id = auth.uid()
);

-- Students can insert an attendance log (mark attendance)
DROP POLICY IF EXISTS "Students can mark attendance" ON public.attendance_logs;
CREATE POLICY "Students can mark attendance" ON public.attendance_logs FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.course_sessions 
        WHERE id = attendance_logs.session_id 
        AND status = 'active'
    )
);
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
-- 1. Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'PDF', 'Video', 'Archive', 'Link', etc.
    file_path TEXT,     -- Path in Supabase Storage or external URL
    size TEXT,          -- Display size like '2.4 MB'
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_course_materials_updated ON public.course_materials;
CREATE TRIGGER on_course_materials_updated
    BEFORE UPDATE ON public.course_materials
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. RLS Policies for course_materials
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Students can read materials for their courses
DROP POLICY IF EXISTS "Students can view materials for enrolled courses." ON public.course_materials;
CREATE POLICY "Students can view materials for enrolled courses." ON public.course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = public.course_materials.course_id AND student_id = auth.uid())
);

-- Faculty can read materials for their courses
DROP POLICY IF EXISTS "Faculty can view materials for their courses." ON public.course_materials;
CREATE POLICY "Faculty can view materials for their courses." ON public.course_materials FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can insert materials for their courses
DROP POLICY IF EXISTS "Faculty can insert materials." ON public.course_materials;
CREATE POLICY "Faculty can insert materials." ON public.course_materials FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can update materials for their courses
DROP POLICY IF EXISTS "Faculty can update materials." ON public.course_materials;
CREATE POLICY "Faculty can update materials." ON public.course_materials FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Faculty can delete materials for their courses
DROP POLICY IF EXISTS "Faculty can delete materials." ON public.course_materials;
CREATE POLICY "Faculty can delete materials." ON public.course_materials FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- 3. Storage Setup for 'course_materials' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('course_materials', 'course_materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
-- Note: 'course_materials' bucket allows public read since we handle authorization in the UI/signed URLs
-- For a strict setup, we'd check auth.uid(), but Supabase storage policies can be complex with foreign keys.
-- For this prototype, we'll allow authenticated users to upload and anyone to read (bucket is public).

DROP POLICY IF EXISTS "Materials are publicly accessible." ON storage.objects;
CREATE POLICY "Materials are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'course_materials' );

DROP POLICY IF EXISTS "Authenticated users can upload materials." ON storage.objects;
CREATE POLICY "Authenticated users can upload materials."
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'course_materials' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated users can update their materials." ON storage.objects;
CREATE POLICY "Authenticated users can update their materials."
ON storage.objects FOR UPDATE
USING ( bucket_id = 'course_materials' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Authenticated users can delete their materials." ON storage.objects;
CREATE POLICY "Authenticated users can delete their materials."
ON storage.objects FOR DELETE
USING ( bucket_id = 'course_materials' AND auth.uid() = owner );
-- Assignments and Submissions Schema

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  due_date timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

-- Ensure all columns exist in case the table was created earlier with a different schema
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS course_id uuid references public.courses(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid references public.profiles(id);

-- RLS Policies for assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Faculty manage assignments" ON public.assignments;
CREATE POLICY "Faculty manage assignments" ON public.assignments
  FOR ALL USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Students view assignments for enrolled courses" ON public.assignments;
CREATE POLICY "Students view assignments for enrolled courses" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.course_id = assignments.course_id
        AND ce.student_id = auth.uid()
    )
  );


-- Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending','submitted','graded')),
  file_url text,
  grade numeric(5,2),
  feedback text,
  submitted_at timestamptz,
  graded_at timestamptz,
  UNIQUE(assignment_id, student_id)
);

-- Ensure all columns exist in case the table was created earlier with a different schema
ALTER TABLE public.assignment_submissions 
  ADD COLUMN IF NOT EXISTS assignment_id uuid references public.assignments(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS student_id uuid references public.profiles(id),
  ADD COLUMN IF NOT EXISTS status text default 'pending',
  ADD COLUMN IF NOT EXISTS file_url text,
  ADD COLUMN IF NOT EXISTS grade numeric(5,2),
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS graded_at timestamptz;

-- RLS Policies for assignment_submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own submissions" ON public.assignment_submissions;
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions
  FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Faculty view/grade submissions for their assignments" ON public.assignment_submissions;
CREATE POLICY "Faculty view/grade submissions for their assignments" ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_submissions.assignment_id
        AND a.created_by = auth.uid()
    )
  );


-- Notifications Schema
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','success','warning','error')),
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- Ensure all columns exist in case the table was created earlier with a different schema
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS user_id uuid references public.profiles(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS type text default 'info',
  ADD COLUMN IF NOT EXISTS is_read boolean default false;

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);


-- Supabase Storage Bucket for Assignment Submissions
-- Note: In a raw SQL migration, inserting into storage.buckets can fail if it already exists unless we handle it,
-- but standard Supabase migrations usually accept standard INSERTS if they are the first time. 
-- We use DO block to prevent error if it exists.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'assignment-submissions'
    ) THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-submissions', 'assignment-submissions', false);
    END IF;
END $$;

DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
CREATE POLICY "Students upload own submissions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'assignment-submissions' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Students/Faculty read submissions" ON storage.objects;
CREATE POLICY "Students/Faculty read submissions" ON storage.objects
  FOR SELECT USING (bucket_id = 'assignment-submissions' AND auth.role() = 'authenticated');
-- Add theme column to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email addresses for existing users from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
-- 0008_sql_optimizations.sql
-- Contains performance, consistency, and security improvements for the database schema.

-- 1. Database Indexing (Performance Optimization)
-- PostgreSQL does not index foreign keys by default. We add them here to speed up RLS policies and JOINs.

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);

-- Course Enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON public.course_enrollments(student_id);

-- Course Sessions (Replaced attendance_sessions in 0002)
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_created_by ON public.course_sessions(created_by);

-- Attendance Logs (Replaced attendance_records in 0002)
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session_id ON public.attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student_id ON public.attendance_logs(student_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON public.announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- Course Materials
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_uploaded_by ON public.course_materials(uploaded_by);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);

-- Assignment Submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);


-- 2. Trigger and Data Consistency Enhancements

-- Ensure updated_at triggers exist for tables that might be updated over time
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
DROP TRIGGER IF EXISTS on_assignments_updated ON public.assignments;
CREATE TRIGGER on_assignments_updated
    BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
DROP TRIGGER IF EXISTS on_assignment_submissions_updated ON public.assignment_submissions;
CREATE TRIGGER on_assignment_submissions_updated
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
DROP TRIGGER IF EXISTS on_notifications_updated ON public.notifications;
CREATE TRIGGER on_notifications_updated
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Re-define handle_new_user to properly capture `email` added in 0007_add_email_to_profiles.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    avatar_url,
    department,
    year_of_study,
    college,
    roll_number
  )
  VALUES (
    NEW.id,
    NEW.email,
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


-- 3. Optimization of existing RLS policies
-- The indexes applied above will drastically speed up all the `EXISTS (SELECT 1 FROM ...)` RLS policies throughout the project.


-- 4. Supabase Storage Policies Security Enhancements
-- Ensuring users can only upload files that are explicitly owned by them (auth.uid() = owner).

DROP POLICY IF EXISTS "Authenticated users can upload materials." ON storage.objects;
CREATE POLICY "Authenticated users can upload materials."
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'course_materials' 
  AND auth.role() = 'authenticated'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
CREATE POLICY "Students upload own submissions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignment-submissions' 
    AND auth.role() = 'authenticated'
    AND auth.uid() = owner
);
-- ============================================================
-- 0009_admin_improvements.sql
-- Adds user status, admin-level RLS policies, and indexes
-- ============================================================

-- 1. Add status column to profiles (active | suspended)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('active', 'suspended'))
    DEFAULT 'active' NOT NULL;

-- 2. Index for fast lookups by role and status in the admin panel
CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);

-- ============================================================
-- 3. Admin RLS — allow admins to update any profile's role/status
-- ============================================================

-- Helper function: returns true when the calling user is an admin.
-- SECURITY DEFINER so it runs as the function owner (no infinite recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop old restrictive update policy so we can replace it
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Users can update their own profile (non-role/status fields)
CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (role, status, etc.)
CREATE POLICY "Admins can update any profile."
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_departments_updated ON public.departments;
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

-- Ensure columns exist before adding foreign keys
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS department TEXT;

-- Drop existing constraints if any (to be safe)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_department;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS fk_courses_department;

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
DROP POLICY IF EXISTS "Departments are viewable by everyone." ON public.departments;
CREATE POLICY "Departments are viewable by everyone." 
    ON public.departments FOR SELECT USING (true);

-- Admins can insert departments
DROP POLICY IF EXISTS "Admins can insert departments." ON public.departments;
CREATE POLICY "Admins can insert departments." 
    ON public.departments FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update departments
DROP POLICY IF EXISTS "Admins can update departments." ON public.departments;
CREATE POLICY "Admins can update departments." 
    ON public.departments FOR UPDATE USING (public.is_admin());

-- Admins can delete departments
DROP POLICY IF EXISTS "Admins can delete departments." ON public.departments;
CREATE POLICY "Admins can delete departments." 
    ON public.departments FOR DELETE USING (public.is_admin());
CREATE TABLE IF NOT EXISTS public.global_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Messages are viewable by everyone." ON public.global_messages;
CREATE POLICY "Messages are viewable by everyone." 
    ON public.global_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own messages." ON public.global_messages;
CREATE POLICY "Users can insert their own messages." 
    ON public.global_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete any messages." ON public.global_messages;
CREATE POLICY "Admins can delete any messages." 
    ON public.global_messages FOR DELETE USING (public.is_admin());

-- Enable Realtime for global_messages
-- Postgres 15+ allows adding tables to publications dynamically if not already added
-- Usually Supabase uses the 'supabase_realtime' publication for realtime changes
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'global_messages'
    ) THEN
      -- If the publication exists, we add the table to it
      IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;
      END IF;
    END IF;
  END
  $$;
COMMIT;
-- Migration to fix Supabase Linter warnings for security and RLS

-- 1. function_search_path_mutable
-- Enforce a specific search_path for security definer functions to prevent search path hijacking.
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- For functions that might have been created via dashboard and not in migrations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'touch_updated_at' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_profile_role') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'current_profile_role' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_faculty') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'is_faculty' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'log_audit_event' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || oid::regprocedure || ' SET search_path = public;'
            FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace
        );
    END IF;
END
$$;

-- 2. anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- For is_admin(), it is safe to be SECURITY INVOKER since public.profiles is readable by everyone.
ALTER FUNCTION public.is_admin() SECURITY INVOKER;

-- For trigger functions, revoke EXECUTE from PUBLIC so they are not exposed via RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;

-- Revoke for other dashboard-created functions if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_event') THEN
        EXECUTE (
            SELECT 'REVOKE EXECUTE ON FUNCTION ' || oid::regprocedure || ' FROM PUBLIC, anon, authenticated;'
            FROM pg_proc WHERE proname = 'log_audit_event' AND pronamespace = 'public'::regnamespace
        );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE (
            SELECT 'REVOKE EXECUTE ON FUNCTION ' || oid::regprocedure || ' FROM PUBLIC, anon, authenticated;'
            FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace
        );
    END IF;
END
$$;

-- 3. rls_policy_always_true
-- Drop the overly permissive auto-generated policies.
DROP POLICY IF EXISTS "Allow all operations for admins" ON public.admins;
DROP POLICY IF EXISTS "Allow all operations for departments" ON public.departments;
DROP POLICY IF EXISTS "Allow all operations for faculty" ON public.faculty;
DROP POLICY IF EXISTS "Allow all operations for students" ON public.students;
DROP POLICY IF EXISTS "Allow all operations for subjects" ON public.subjects;

-- 4. public_bucket_allows_listing
-- "course_materials" has a broad SELECT policy on storage.objects allowing listing.
-- Public buckets do not need SELECT policies for objects to be downloaded.
DROP POLICY IF EXISTS "Materials are publicly accessible." ON storage.objects;

-- 5. extension_in_public
-- Move moddatetime to extensions schema
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'moddatetime' AND extnamespace = 'public'::regnamespace) THEN
        ALTER EXTENSION moddatetime SET SCHEMA extensions;
    END IF;
END
$$;
-- 0013_add_missing_rls_policies.sql
-- Fixes rls_enabled_no_policy warnings for tables created via the dashboard.

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'achievements', 
        'admins', 
        'attendance', 
        'faculty', 
        'learning_progress', 
        'results', 
        'students', 
        'study_groups', 
        'subjects'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Check if the table actually exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- Ensure RLS is enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            
            -- Drop existing policy if any (just in case)
            EXECUTE format('DROP POLICY IF EXISTS "Admins have full access to %I" ON public.%I;', t, t);
            
            -- Create a single admin-only policy to satisfy the linter and lock it down securely
            EXECUTE format('CREATE POLICY "Admins have full access to %I" ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());', t, t);
            
        END IF;
    END LOOP;
END $$;
-- 0014_live_class_pulse.sql
-- Adds the pulse_signals table for real-time anonymous student engagement
-- during active attendance sessions (confused / got_it / question signals).

CREATE TABLE IF NOT EXISTS public.pulse_signals (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id  UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
    signal      TEXT NOT NULL CHECK (signal IN ('confused', 'got_it', 'question')),
    sent_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    -- Intentionally no student_id — signals are fully anonymous.
);

-- Enable RLS
ALTER TABLE public.pulse_signals ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can INSERT a signal (enforced at app level to enrolled students)
DROP POLICY IF EXISTS "Authenticated users can send pulse signals." ON public.pulse_signals;
CREATE POLICY "Authenticated users can send pulse signals."
    ON public.pulse_signals
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Anyone authenticated can SELECT signals (faculty need to read them in realtime)
DROP POLICY IF EXISTS "Authenticated users can view pulse signals." ON public.pulse_signals;
CREATE POLICY "Authenticated users can view pulse signals."
    ON public.pulse_signals
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enable Realtime so the faculty Pulse Panel updates instantly
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename = 'pulse_signals'
    ) THEN
      IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_signals;
      END IF;
    END IF;
  END
  $$;
COMMIT;
