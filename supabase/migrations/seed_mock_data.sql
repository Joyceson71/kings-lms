-- Phase 2: Seed Mock Data for Testing
-- This inserts the mock UUIDs hardcoded in the frontend components so you can test the system without Auth.

-- 1. Insert a Mock Department
INSERT INTO public.departments (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000010', 'Computer Science', 'CS')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert a Mock Subject (used in faculty-view.tsx)
INSERT INTO public.subjects (id, name, code, department_id, semester, credits)
VALUES ('00000000-0000-0000-0000-000000000002', 'Data Structures', 'CS201', '00000000-0000-0000-0000-000000000010', 3, 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert a Mock Faculty Profile and Role (used in faculty-view.tsx)
INSERT INTO public.profiles (id, first_name, last_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'John', 'Doe', 'faculty@test.com', 'faculty')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faculty (id, department_id, designation)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Professor')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert a Mock Student Profile and Role (used in student-view.tsx)
INSERT INTO public.profiles (id, first_name, last_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000003', 'Jane', 'Smith', 'student@test.com', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, roll_number, department_id, current_semester, batch_year)
VALUES ('00000000-0000-0000-0000-000000000003', 'CS23001', '00000000-0000-0000-0000-000000000010', 3, 2023)
ON CONFLICT (id) DO NOTHING;

-- Alice
INSERT INTO public.profiles (id, first_name, last_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000004', 'Alice', 'Johnson', 'alice@test.com', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, roll_number, department_id, current_semester, batch_year)
VALUES ('00000000-0000-0000-0000-000000000004', 'CS23002', '00000000-0000-0000-0000-000000000010', 3, 2023)
ON CONFLICT (id) DO NOTHING;

-- Bob
INSERT INTO public.profiles (id, first_name, last_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000005', 'Bob', 'Williams', 'bob@test.com', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, roll_number, department_id, current_semester, batch_year)
VALUES ('00000000-0000-0000-0000-000000000005', 'CS23003', '00000000-0000-0000-0000-000000000010', 3, 2023)
ON CONFLICT (id) DO NOTHING;
