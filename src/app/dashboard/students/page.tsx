import { createClient } from '@/lib/supabase/server';
import StudentsClient from './students-client';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Only faculty/admin can view the students list
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role === 'student') {
    redirect('/dashboard');
  }

  // Fetch all student profiles
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, year_of_study, roll_number, created_at')
    .eq('role', 'student')
    .order('full_name', { ascending: true });

  if (!students) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <StudentsClient initialStudents={[]} />
      </Suspense>
    );
  }

  // Compute real attendance % per student from attendance_logs
  // Single query: count total sessions per student + present count
  const { data: attendanceCounts } = await supabase
    .from('attendance_logs')
    .select('student_id, status');

  const attendanceMap = new Map<string, { present: number; total: number }>();
  for (const log of attendanceCounts ?? []) {
    const entry = attendanceMap.get(log.student_id) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (log.status === 'Present') entry.present += 1;
    attendanceMap.set(log.student_id, entry);
  }

  const studentsWithStats = students.map((s) => {
    const att = attendanceMap.get(s.id);
    const attendancePct = att && att.total > 0
      ? Math.round((att.present / att.total) * 100)
      : 100; // default 100% if no sessions yet
    return {
      ...s,
      attendance: attendancePct,
      status: 'active' as const,
    };
  });

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <StudentsClient initialStudents={studentsWithStats} />
    </Suspense>
  );
}
