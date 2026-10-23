import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { AtRiskPanel, type AtRiskStudent } from '@/components/students/at-risk-panel';

export default async function AtRiskPage() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['faculty', 'admin'].includes(profile.role ?? '')) redirect('/dashboard');

  const service = createServiceClient();
  let courseQuery = service.from('courses').select('id, title, code, created_by').order('title');
  if (profile.role === 'faculty') courseQuery = courseQuery.eq('created_by', user.id);
  const { data: courseData, error: courseError } = await courseQuery;
  if (courseError) throw courseError;
  const courses = (courseData ?? []) as Array<{ id: string; title: string; code: string | null; created_by: string | null }>;
  const courseIds = courses.map(course => course.id);
  if (courseIds.length === 0) return <AtRiskPanel students={[]} courses={[]} />;

  const [{ data: enrollmentData, error: enrollmentError }, { data: sessionData, error: sessionError }, { data: internalMarkData, error: internalMarkError }, { data: assignmentData, error: assignmentError }] = await Promise.all([
    service.from('course_enrollments').select('student_id, course_id').in('course_id', courseIds),
    service.from('course_sessions').select('id, course_id').in('course_id', courseIds).neq('status', 'active'),
    service.from('internal_marks').select('student_id, course_id, marks_obtained, max_marks').in('course_id', courseIds),
    service.from('assignments').select('id, course_id, due_date').in('course_id', courseIds).lt('due_date', new Date().toISOString()),
  ]);
  if (enrollmentError) throw enrollmentError;
  if (sessionError) throw sessionError;
  if (internalMarkError) throw internalMarkError;
  if (assignmentError) throw assignmentError;

  const enrollments = (enrollmentData ?? []) as Array<{ student_id: string; course_id: string }>;
  const sessions = (sessionData ?? []) as Array<{ id: string; course_id: string }>;
  const internalMarks = (internalMarkData ?? []) as Array<{ student_id: string; course_id: string; marks_obtained: number | null; max_marks: number | null }>;
  const assignments = (assignmentData ?? []) as Array<{ id: string; course_id: string; due_date: string | null }>;
  const studentIds = [...new Set(enrollments.map(enrollment => enrollment.student_id))];
  const sessionIds = sessions.map(session => session.id);
  const assignmentIds = assignments.map(assignment => assignment.id);

  const [{ data: attendanceData, error: attendanceError }, { data: submissionData, error: submissionError }, { data: studentData, error: studentError }] = await Promise.all([
    sessionIds.length > 0
      ? service.from('attendance_logs').select('student_id, session_id, status').in('session_id', sessionIds)
      : Promise.resolve({ data: [], error: null }),
    assignmentIds.length > 0
      ? service.from('assignment_submissions').select('student_id, assignment_id, status, submitted_at').in('assignment_id', assignmentIds)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length > 0
      ? service.from('profiles').select('id, full_name, roll_number').in('id', studentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (attendanceError) throw attendanceError;
  if (submissionError) throw submissionError;
  if (studentError) throw studentError;

  const attendanceRows = (attendanceData ?? []) as Array<{ student_id: string; session_id: string; status: string }>;
  const submissionRows = (submissionData ?? []) as Array<{ student_id: string; assignment_id: string; status: string; submitted_at: string | null }>;
  const students = (studentData ?? []) as Array<{ id: string; full_name: string | null; roll_number: string | null }>;
  const studentsById = new Map(students.map(student => [student.id, student]));
  const courseById = new Map(courses.map(course => [course.id, course]));
  const courseBySession = new Map(sessions.map(session => [session.id, session.course_id]));
  const sessionCounts = new Map<string, { attended: number; total: number }>();
  const enrollmentsByCourse = new Map<string, string[]>();
  for (const enrollment of enrollments) {
    const list = enrollmentsByCourse.get(enrollment.course_id) ?? [];
    list.push(enrollment.student_id);
    enrollmentsByCourse.set(enrollment.course_id, list);
  }
  for (const session of sessions) {
    for (const studentId of enrollmentsByCourse.get(session.course_id) ?? []) {
      const key = `${session.course_id}:${studentId}`;
      const count = sessionCounts.get(key) ?? { attended: 0, total: 0 };
      count.total += 1;
      sessionCounts.set(key, count);
    }
  }
  for (const attendance of attendanceRows) {
    const courseId = courseBySession.get(attendance.session_id);
    if (!courseId) continue;
    const key = `${courseId}:${attendance.student_id}`;
    const count = sessionCounts.get(key);
    if (count && attendance.status.toLowerCase() === 'present') count.attended += 1;
  }

  const markTotals = new Map<string, { obtained: number; maximum: number }>();
  for (const mark of internalMarks) {
    if (mark.marks_obtained === null || !mark.max_marks || mark.max_marks <= 0) continue;
    const key = `${mark.course_id}:${mark.student_id}`;
    const total = markTotals.get(key) ?? { obtained: 0, maximum: 0 };
    total.obtained += mark.marks_obtained;
    total.maximum += mark.max_marks;
    markTotals.set(key, total);
  }

  const submitted = new Set(submissionRows
    .filter(row => row.submitted_at || row.status === 'submitted' || row.status === 'graded')
    .map(row => `${row.assignment_id}:${row.student_id}`));
  const overdueByCourse = new Map<string, string[]>();
  for (const assignment of assignments) {
    const list = overdueByCourse.get(assignment.course_id) ?? [];
    list.push(assignment.id);
    overdueByCourse.set(assignment.course_id, list);
  }

  const atRisk: AtRiskStudent[] = [];
  for (const enrollment of enrollments) {
    const key = `${enrollment.course_id}:${enrollment.student_id}`;
    const attendance = sessionCounts.get(key) ?? { attended: 0, total: 0 };
    const attendancePercent = attendance.total > 0 ? Math.round((attendance.attended / attendance.total) * 100) : null;
    const marks = markTotals.get(key);
    const internalPercent = marks && marks.maximum > 0 ? Math.round((marks.obtained / marks.maximum) * 100) : null;
    const overdue = overdueByCourse.get(enrollment.course_id) ?? [];
    const missingSubmissions = overdue.filter(assignmentId => !submitted.has(`${assignmentId}:${enrollment.student_id}`)).length;
    const reasons: string[] = [];
    if (attendancePercent !== null && attendancePercent < 75) reasons.push('Low attendance');
    if (internalPercent !== null && internalPercent < 50) reasons.push('Low internal marks');
    if (missingSubmissions > 0) reasons.push(`${missingSubmissions} missing submission${missingSubmissions === 1 ? '' : 's'}`);
    if (reasons.length === 0) continue;

    const student = studentsById.get(enrollment.student_id);
    const course = courseById.get(enrollment.course_id);
    if (!student || !course) continue;
    atRisk.push({
      studentId: student.id,
      studentName: student.full_name ?? 'Student',
      rollNumber: student.roll_number,
      courseId: course.id,
      courseName: course.code ? `${course.code}: ${course.title}` : course.title,
      attendancePercent,
      internalPercent,
      missingSubmissions,
      reasons,
    });
  }

  return <AtRiskPanel students={atRisk} courses={courses.map(({ id, title, code }) => ({ id, name: code ? `${code}: ${title}` : title }))} />;
}
