-- 0028_core_features.sql
-- Fixes dashboard mock tables and properly alters existing schema

-- 0. Profiles setup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Cleanup any mock tables created via dashboard that clash with our schema
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS library_resources CASCADE;
DROP TABLE IF EXISTS user_xp CASCADE;
DROP TABLE IF EXISTS xp_logs CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS attendance_summary CASCADE;

-- 1. Modules (course sections)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resources (course files / links)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('pdf','video','ppt','link','code','markdown')) NOT NULL,
  file_url TEXT,  
  uploaded_by UUID REFERENCES profiles(id),
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student progress per module
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, module_id)
);

-- 4. Assignments (Alter existing)
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS rubric JSONB,
  ADD COLUMN IF NOT EXISTS max_score INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS late_submission_allowed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS late_penalty_percent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 5. Assignment Submissions (Alter existing)
ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS text_content TEXT,
  ADD COLUMN IF NOT EXISTS score INT,
  ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;

-- 6. Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  passing_score INT DEFAULT 40,
  negative_marking FLOAT DEFAULT 0.0,
  shuffle_options BOOLEAN DEFAULT TRUE,
  show_answers_after BOOLEAN DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  max_attempts INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type TEXT CHECK (type IN ('mcq','multi_select','short_answer')) DEFAULT 'mcq',
  marks INT DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'medium',
  explanation TEXT,
  order_index INT DEFAULT 0
);

-- 8. Question Options (for MCQ)
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0
);

-- 9. Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score INT,
  time_taken_seconds INT,
  status TEXT CHECK (status IN ('in_progress','submitted')) DEFAULT 'in_progress'
);

-- 10. Quiz Answers
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id),
  answer_text TEXT,
  is_correct BOOLEAN,
  marks_obtained FLOAT DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications (Alter existing from 0005/0023)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_id UUID;

-- 12. Messages (chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id),  
  course_id UUID REFERENCES courses(id),      
  content TEXT NOT NULL,
  file_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Library Resources
CREATE TABLE library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  type TEXT CHECK (type IN ('textbook','question_paper','lab_manual','research_paper','notes')),
  year INT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  department_id UUID,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. XP / Gamification
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  
  xp_gained INT NOT NULL,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,  
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,   
  criteria JSONB
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

-- 15. Attendance summary
CREATE TABLE attendance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  total_sessions INT DEFAULT 0,
  attended INT DEFAULT 0,
  attendance_pct FLOAT DEFAULT 0.0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_module ON resources(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_messages_course ON messages(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_logs_student ON xp_logs(student_id, created_at DESC);

-- RLS Policies
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrolled or faculty view modules" ON modules FOR SELECT USING (
  course_id IN (SELECT course_id FROM course_enrollments WHERE student_id = auth.uid())
  OR course_id IN (SELECT id FROM courses WHERE faculty_id = auth.uid())
);
CREATE POLICY "faculty manage modules" ON modules FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE faculty_id = auth.uid())
);
CREATE POLICY "view resources same as module" ON resources FOR SELECT USING (
  module_id IN (SELECT id FROM modules WHERE course_id IN (
    SELECT course_id FROM course_enrollments WHERE student_id = auth.uid()
    UNION SELECT id FROM courses WHERE faculty_id = auth.uid()
  ))
);
CREATE POLICY "faculty upload resources" ON resources FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "student manage own progress" ON student_progress FOR ALL USING (auth.uid() = student_id);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrolled students view quizzes" ON quizzes FOR SELECT USING (
  course_id IN (SELECT course_id FROM course_enrollments WHERE student_id = auth.uid())
  OR auth.uid() = created_by
);
CREATE POLICY "faculty manage quizzes" ON quizzes FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "student view questions during attempt" ON questions FOR SELECT USING (
  quiz_id IN (SELECT quiz_id FROM quiz_attempts WHERE student_id = auth.uid() AND status = 'in_progress')
  OR quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.uid())
);
CREATE POLICY "student manage own attempts" ON quiz_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "student manage own answers" ON quiz_answers FOR ALL USING (
  attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = auth.uid())
);

-- Update attendance summary trigger
CREATE OR REPLACE FUNCTION update_attendance_summary() RETURNS trigger AS $$
BEGIN
  INSERT INTO attendance_summary (student_id, course_id, total_sessions, attended, attendance_pct)
  SELECT 
    NEW.student_id,
    s.course_id,
    COUNT(DISTINCT ar.session_id),
    COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.session_id END),
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.session_id END) / 
      NULLIF(COUNT(DISTINCT ar.session_id), 0), 2)
  FROM attendance_records ar
  JOIN attendance_sessions s ON ar.session_id = s.id
  WHERE ar.student_id = NEW.student_id AND s.course_id = (
    SELECT course_id FROM attendance_sessions WHERE id = NEW.session_id
  )
  GROUP BY NEW.student_id, s.course_id
  ON CONFLICT (student_id, course_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    attended = EXCLUDED.attended,
    attendance_pct = EXCLUDED.attendance_pct,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_summary_trigger ON attendance_records;
CREATE TRIGGER attendance_summary_trigger
  AFTER INSERT ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_attendance_summary();

-- XP RPC
CREATE OR REPLACE FUNCTION increment_xp(p_student_id UUID, p_xp INT) RETURNS void AS $$
BEGIN
  INSERT INTO user_xp (student_id, total_xp, current_level)
  VALUES (p_student_id, p_xp, 1)
  ON CONFLICT (student_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_xp,
    current_level = CASE
      WHEN user_xp.total_xp + p_xp < 500 THEN 1
      WHEN user_xp.total_xp + p_xp < 1500 THEN 2
      WHEN user_xp.total_xp + p_xp < 3500 THEN 3
      WHEN user_xp.total_xp + p_xp < 7000 THEN 4
      ELSE 5
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
