import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
import { getDashboardStats, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

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

  return (
    <DashboardClient
      stats={stats}
      profile={profile}
      studentData={studentData}
    />
  );
}
