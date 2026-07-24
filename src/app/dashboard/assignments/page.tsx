import { createClient } from '@/lib/supabase/server';
import AssignmentsClient from './assignments-client';
import { getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    redirect('/onboarding');
  }

  const isFaculty = profile.role !== 'student';
  type AssignmentStatus = 'pending' | 'submitted' | 'graded';
  let assignments: {
    id: string;
    title: string;
    course: string;
    code: string;
    due: string;
    status: AssignmentStatus;
    grade?: string;
    description: string;
    icon: string;
  }[] = [];

  if (profile.role === 'student') {
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    const courseIds = enrollments?.map(e => e.course_id) || [];

    if (courseIds.length > 0) {
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*, courses(title, code)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });

      if (assignmentData) {
        const assignmentIds = assignmentData.map(a => a.id);
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', user.id)
          .in('assignment_id', assignmentIds);

        const submissionsMap = new Map(submissions?.map(s => [s.assignment_id, s]));

        assignments = assignmentData.map(a => {
          const sub = submissionsMap.get(a.id);
          return {
            id: a.id,
            title: a.title,
            course: (a.courses as { title: string } | null)?.title || 'Unknown Course',
            code: (a.courses as { code: string } | null)?.code || '---',
            due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due Date',
            status: (sub?.status as AssignmentStatus) || 'pending',
            grade: sub?.grade ? `${sub.grade}%` : undefined,
            description: a.description || '',
            icon: '📝',
          };
        });
      }
    }
  } else {
    const { data: assignmentData } = await supabase
      .from('assignments')
      .select('*, courses(title, code)')
      .eq('created_by', user.id)
      .order('due_date', { ascending: true });

    if (assignmentData) {
      assignments = assignmentData.map(a => ({
        id: a.id,
        title: a.title,
        course: (a.courses as { title: string } | null)?.title || 'Unknown Course',
        code: (a.courses as { code: string } | null)?.code || '---',
        due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due Date',
        status: 'pending' as const,
        description: a.description || '',
        icon: '📝',
      }));
    }
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AssignmentsClient
        initialAssignments={assignments}
        isFaculty={isFaculty}
      />
    </Suspense>
  );
}
