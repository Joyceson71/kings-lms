-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start with a clean slate
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.attendance_sessions CASCADE;
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'faculty', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS on_courses_updated ON public.courses;
CREATE TRIGGER on_courses_updated
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (student_id, course_id)
);

-- 4. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (student_id, session_id)
);

-- Setup Row Level Security (RLS)

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone." ON public.courses FOR SELECT USING (true);
CREATE POLICY "Faculty can insert courses." ON public.courses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);
CREATE POLICY "Faculty can update their courses." ON public.courses FOR UPDATE USING (created_by = auth.uid());

-- Course Enrollments RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own enrollments." ON public.course_enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Faculty can view enrollments for their courses." ON public.course_enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);
CREATE POLICY "Faculty can enroll students." ON public.course_enrollments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);
CREATE POLICY "Faculty can remove enrollments." ON public.course_enrollments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Attendance Sessions RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view active sessions for enrolled courses." ON public.attendance_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = public.attendance_sessions.course_id AND student_id = auth.uid())
);
CREATE POLICY "Faculty can manage sessions for their courses." ON public.attendance_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND created_by = auth.uid())
);

-- Attendance Records RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own attendance." ON public.attendance_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Faculty can view attendance for their courses." ON public.attendance_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions s 
        JOIN public.courses c ON s.course_id = c.id
        WHERE s.id = session_id AND c.created_by = auth.uid()
    )
);
CREATE POLICY "Students can mark their own attendance." ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Faculty can update attendance." ON public.attendance_records FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.attendance_sessions s 
        JOIN public.courses c ON s.course_id = c.id
        WHERE s.id = session_id AND c.created_by = auth.uid()
    )
);

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
