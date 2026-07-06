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
