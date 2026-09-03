-- 0031_fortify_missing_rls.sql
-- Enables Row Level Security (RLS) on tables that were missed in 0028.

-- 1. Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their messages or course messages" ON public.messages;
CREATE POLICY "Users can view their messages or course messages" ON public.messages 
  FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id 
    OR public.is_enrolled_in_course(course_id) 
    OR public.is_course_faculty(course_id)
  );

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
CREATE POLICY "Users can insert their own messages" ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 2. Library Resources
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view library resources" ON public.library_resources;
CREATE POLICY "Everyone can view library resources" ON public.library_resources 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Faculty can upload library resources" ON public.library_resources;
CREATE POLICY "Faculty can upload library resources" ON public.library_resources 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
    AND auth.uid() = uploaded_by
  );

-- 3. Gamification: User XP
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view XP leaderboard" ON public.user_xp;
CREATE POLICY "Everyone can view XP leaderboard" ON public.user_xp 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own XP" ON public.user_xp;
CREATE POLICY "Users can manage their own XP" ON public.user_xp 
  FOR ALL USING (auth.uid() = student_id);

-- 4. Gamification: XP Logs
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own XP logs" ON public.xp_logs;
CREATE POLICY "Users can view their own XP logs" ON public.xp_logs 
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can insert their own XP logs" ON public.xp_logs;
CREATE POLICY "Users can insert their own XP logs" ON public.xp_logs 
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 5. Gamification: Achievements Catalog
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view achievements" ON public.achievements;
CREATE POLICY "Everyone can view achievements" ON public.achievements 
  FOR SELECT USING (true);
-- No insert/update policy means only admins/service_role can modify the catalog

-- 6. Gamification: User Achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view earned achievements" ON public.user_achievements;
CREATE POLICY "Everyone can view earned achievements" ON public.user_achievements 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;
CREATE POLICY "Users can earn achievements" ON public.user_achievements 
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 7. Attendance Summary
ALTER TABLE public.attendance_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own attendance summary" ON public.attendance_summary;
CREATE POLICY "Users view own attendance summary" ON public.attendance_summary 
  FOR SELECT USING (
    auth.uid() = student_id 
    OR public.is_course_faculty(course_id)
  );
-- Updates are handled by triggers which bypass RLS (since triggers run as the table owner by default or SECURITY DEFINER). 
-- No direct update policies needed for students.

-- 8. Question Options
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view question options" ON public.question_options;
CREATE POLICY "Everyone can view question options" ON public.question_options 
  FOR SELECT USING (true);
