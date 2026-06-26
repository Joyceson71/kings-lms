-- Phase 1: Foundation & Core Infrastructure
-- Initial Schema Definition

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Clean up existing structures to avoid 'already exists' errors during testing
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'student');

-- 2. Base Tables

-- Departments
CREATE TABLE public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Subjects
CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
    credits INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Profiles (Base User Data)
-- Note: id references auth.users(id) once Auth is integrated in Phase 3
CREATE TABLE public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Specific Role Tables

-- Admins
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL, -- Optional department restriction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Faculty
CREATE TABLE public.faculty (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Students
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    current_semester INTEGER NOT NULL CHECK (current_semester >= 1 AND current_semester <= 10),
    batch_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Triggers for updated_at
CREATE TRIGGER handle_updated_at_departments
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_subjects
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_admins
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_faculty
    BEFORE UPDATE ON public.faculty
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER handle_updated_at_students
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- 5. Indexes for optimization
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_students_roll_number ON public.students(roll_number);
CREATE INDEX idx_students_department ON public.students(department_id);
CREATE INDEX idx_faculty_department ON public.faculty(department_id);
CREATE INDEX idx_subjects_department ON public.subjects(department_id);

-- 6. Row Level Security (RLS) policies - Stubbed as Open for testing until Phase 3
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now
CREATE POLICY "Allow all operations for departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for faculty" ON public.faculty FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for students" ON public.students FOR ALL USING (true) WITH CHECK (true);
