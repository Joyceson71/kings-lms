'use client';

import { createClient } from '@/lib/supabase/client';

export interface BobStudentContext {
  studentName: string;
  studentRole: 'student' | 'faculty' | 'admin';
  enrolledCourses: { id: string; name: string; code: string }[];
  attendanceByCourse: {
    courseId: string;
    courseName: string;
    attendancePercentage: number;
    sessionsMissed: number;
    totalSessions: number;
  }[];
  pendingAssignments: {
    title: string;
    courseName: string;
    dueDate: string;
    hoursUntilDue: number;
    status: 'pending' | 'submitted' | 'graded';
  }[];
  hasCriticalAttendance: boolean;
  hasLowAttendance: boolean;
  hasCriticalDeadline: boolean;
  hasUpcomingDeadline: boolean;
  hasOverdueWork: boolean;
}

export async function fetchBobContext(userId: string): Promise<BobStudentContext> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single();

  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('courses(id, name, code)')
    .eq('student_id', userId);

  const enrolledCourses = ((enrollments ?? []) as any[])
    .map((e: any) => {
      const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
      return c ? { id: c.id, name: c.name ?? c.title ?? 'Unknown', code: c.code ?? '' } : null;
    })
    .filter(Boolean) as { id: string; name: string; code: string }[];

  const attendanceByCourse = await Promise.all(
    enrolledCourses.map(async (course) => {
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('course_id', course.id);

      const sessionIds = (sessions ?? []).map((s: any) => s.id);
      const totalSessions = sessionIds.length;

      const { count: attendedCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .in('session_id', sessionIds.length > 0 ? sessionIds : ['__none__']);

      const attended = attendedCount ?? 0;
      const attendancePercentage = totalSessions > 0
        ? Math.round((attended / totalSessions) * 100)
        : 100;

      return {
        courseId: course.id,
        courseName: course.name,
        attendancePercentage,
        sessionsMissed: totalSessions - attended,
        totalSessions,
      };
    })
  );

  const pendingAssignments: BobStudentContext['pendingAssignments'] = [];

  const hasCriticalAttendance = attendanceByCourse.some(c => c.attendancePercentage < 60);
  const hasLowAttendance = attendanceByCourse.some(
    c => c.attendancePercentage >= 60 && c.attendancePercentage < 75
  );
  const hasCriticalDeadline = pendingAssignments.some(a => a.hoursUntilDue <= 6);
  const hasUpcomingDeadline = pendingAssignments.some(a => a.hoursUntilDue <= 24);
  const hasOverdueWork = pendingAssignments.some(a => a.hoursUntilDue < 0);

  return {
    studentName: profile?.full_name ?? 'Student',
    studentRole: (profile?.role as BobStudentContext['studentRole']) ?? 'student',
    enrolledCourses,
    attendanceByCourse,
    pendingAssignments,
    hasCriticalAttendance,
    hasLowAttendance,
    hasCriticalDeadline,
    hasUpcomingDeadline,
    hasOverdueWork,
  };
}
