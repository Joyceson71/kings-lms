import { getUserOrLocal } from '@/lib/supabase/get-user-or-local';
import { createClient } from '@/lib/supabase/server';
import AssignmentsClient from './assignments-client';
import { getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AssignmentsPage() {
  const user = await getUserOrLocal();

  if (!user) {
    redirect('/login');
  }

  let assignments: any[] = [];
  let isFaculty = false;

  if (user.source === 'supabase') {
    const supabase = await createClient();
    const profile = await getProfile(supabase, user.id);
    if (!profile) {
      redirect('/onboarding');
    }

    isFaculty = profile.role !== 'student';

    if (profile.role === 'student') {
      // 1. Get enrolled courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user.id);
        
      const courseIds = enrollments?.map(e => e.course_id) || [];
      
      if (courseIds.length > 0) {
        // 2. Get assignments for these courses
        const { data: assignmentData } = await supabase
          .from('assignments')
          .select('*, courses(title, code)')
          .in('course_id', courseIds)
          .order('due_date', { ascending: true });
          
        if (assignmentData) {
          // 3. Get student's submissions for these assignments
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
              course: a.courses?.title || 'Unknown Course',
              code: a.courses?.code || '---',
              due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due Date',
              status: sub?.status || 'pending',
              grade: sub?.grade ? `${sub.grade}%` : undefined,
              description: a.description || '',
              icon: '📝',
            };
          });
        }
      }
    } else {
      // Faculty: get assignments they created
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*, courses(title, code)')
        .eq('created_by', user.id)
        .order('due_date', { ascending: true });
        
      if (assignmentData) {
        // For faculty, we might just want to list them all as 'pending' (to be graded)
        // or we can just mock the status for now
        assignments = assignmentData.map(a => ({
          id: a.id,
          title: a.title,
          course: a.courses?.title || 'Unknown Course',
          code: a.courses?.code || '---',
          due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No Due Date',
          status: 'pending', // Faculty views them to be graded
          description: a.description || '',
          icon: '📝',
        }));
      }
    }
  }
  // For local-auth users the client-side useUser() hook provides the profile.

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
