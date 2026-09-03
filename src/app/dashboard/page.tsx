import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
import { getDashboardStats, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

// Compute attendance trend for the last N days (2 queries, not 14)
async function getAttendanceTrend(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
  days = 7
): Promise<{ date: string; rate: number; present: number; total: number }[]> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - (days - 1));
  windowStart.setHours(0, 0, 0, 0);

  // Query 1: all sessions in the window
  const { data: sessions } = await supabase
    .from('course_sessions')
    .select('id, started_at')
    .gte('started_at', windowStart.toISOString());

  const allSessions = sessions ?? [];
  const allSessionIds = allSessions.map((s: any) => s.id);

  // Query 2: attendance logs for those sessions
  let logs: { session_id: string; status: string }[] = [];
  if (allSessionIds.length > 0) {
    let logQuery = supabase
      .from('attendance_logs')
      .select('session_id, status')
      .in('session_id', allSessionIds);
    if (role === 'student') logQuery = logQuery.eq('student_id', userId);
    const { data: logData } = await logQuery;
    logs = logData ?? [];
  }

  // Group in memory by calendar day
  const result: { date: string; rate: number; present: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayStr = day.toDateString();

    const daySessions = allSessions.filter(
      (s: any) => new Date(s.started_at).toDateString() === dayStr
    );
    const daySessionIds = new Set(daySessions.map((s: any) => s.id));
    const total = daySessions.length;
    const present = logs.filter(
      (l) => daySessionIds.has(l.session_id) && l.status === 'Present'
    ).length;

    result.push({
      date: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      present,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    });
  }
  return result;
}

// Compute study streak (consecutive days with at least 1 Present attendance)
async function getStudyStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('marked_at')
    .eq('student_id', userId)
    .eq('status', 'Present')
    .order('marked_at', { ascending: false });

  if (!logs || logs.length === 0) return 0;

  const attendedDays = new Set(
    logs.map((l: any) => new Date(l.marked_at).toDateString())
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (attendedDays.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// Compute composite study score (0-100): 60% attendance + 40% submission rate
async function getStudyScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  attendanceRate: number
): Promise<number> {
  const { data: subs } = await supabase
    .from('assignment_submissions')
    .select('status')
    .eq('student_id', userId);

  const total = (subs ?? []).length;
  const submitted = (subs ?? []).filter((s: any) => s.status !== 'pending').length;
  const submissionRate = total > 0 ? Math.round((submitted / total) * 100) : 100;

  return Math.round(attendanceRate * 0.6 + submissionRate * 0.4);
}

// Fetch assignment status breakdown for donut chart
async function getAssignmentBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string
): Promise<{ pending: number; submitted: number; graded: number }> {
  let query = supabase.from('assignment_submissions').select('status');
  if (role === 'student') {
    query = query.eq('student_id', userId);
  }
  const { data } = await query;
  const rows = data ?? [];
  return {
    pending:   rows.filter((r: any) => r.status === 'pending').length,
    submitted: rows.filter((r: any) => r.status === 'submitted').length,
    graded:    rows.filter((r: any) => r.status === 'graded').length,
  };
}

// Fetch rich student-specific data for the improved dashboard
async function getStudentDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Enrolled courses with attendance rates
  const { data: enrolledRaw } = await supabase
    .from('course_enrollments')
    .select('courses(id, title, code, description)')
    .eq('student_id', userId);

  const enrolledCourses = (enrolledRaw ?? []).map((e: any) => e.courses).filter(Boolean);

  // Attendance logs per course
  const courseIds = enrolledCourses.map((c: any) => c.id);
  let coursesWithAttendance: { id: string; title: string; code: string; total: number; attended: number; rate: number }[] = [];

  if (courseIds.length > 0) {
    const { data: sessions } = await supabase
      .from('course_sessions')
      .select('id, course_id')
      .in('course_id', courseIds);

    const sessionIds = (sessions ?? []).map((s: any) => s.id);

    const { data: myLogs } = sessionIds.length > 0
      ? await supabase
          .from('attendance_logs')
          .select('session_id, status')
          .eq('student_id', userId)
          .in('session_id', sessionIds)
      : { data: [] };

    coursesWithAttendance = enrolledCourses.map((course: any) => {
      const courseSessions = (sessions ?? []).filter((s: any) => s.course_id === course.id);
      const courseSessionIds = courseSessions.map((s: any) => s.id);
      const total = courseSessions.length;
      const attended = (myLogs ?? []).filter(
        (l: any) => courseSessionIds.includes(l.session_id) && l.status === 'Present'
      ).length;
      const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
      return { id: course.id, title: course.title, code: course.code ?? '', total, attended, rate };
    });
  }

  // Active sessions right now for enrolled courses
  const { data: activeSessions } = courseIds.length > 0
    ? await supabase
        .from('course_sessions')
        .select('id, course_id, room, qr_token, started_at, courses(title, code)')
        .in('course_id', courseIds)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
    : { data: [] };

  // Normalise: Supabase returns courses as array from join
  const normalizedSessions = (activeSessions ?? []).map((s: any) => ({
    ...s,
    courses: Array.isArray(s.courses) ? (s.courses[0] ?? null) : s.courses,
  }));

  // Pending assignments
  const { data: pendingAssignments } = await supabase
    .from('assignment_submissions')
    .select('id, status, assignments(title, due_date, courses(title))')
    .eq('student_id', userId)
    .in('status', ['pending'])
    .order('id', { ascending: false })
    .limit(5);

  // Recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, created_at')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(4);

  return {
    coursesWithAttendance,
    activeSessions: normalizedSessions,
    pendingAssignments: (pendingAssignments ?? []).map((p: any) => ({
      id: p.id,
      title: p.assignments?.title ?? 'Assignment',
      dueDate: p.assignments?.due_date ?? null,
      course: p.assignments?.courses?.title ?? '',
    })),
    notifications: notifications ?? [],
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);
  const userRole = profile?.role || 'student';
  const stats = await getDashboardStats(supabase, user.id, userRole);

  const studentData = userRole === 'student'
    ? await getStudentDashboardData(supabase, user.id)
    : null;

  // Parallel enrichment queries
  const [attendanceTrend, assignmentBreakdown, streak, studyScore] = await Promise.all([
    getAttendanceTrend(supabase, user.id, userRole),
    getAssignmentBreakdown(supabase, user.id, userRole),
    userRole === 'student' ? getStudyStreak(supabase, user.id) : Promise.resolve(0),
    userRole === 'student' ? getStudyScore(supabase, user.id, stats.attendanceRate) : Promise.resolve(0),
  ]);

  return (
    <DashboardClient
      stats={stats}
      profile={profile}
      studentData={studentData}
      attendanceTrend={attendanceTrend}
      assignmentBreakdown={assignmentBreakdown}
      streak={streak}
      studyScore={studyScore}
    />
  );
}
