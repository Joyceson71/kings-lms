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
