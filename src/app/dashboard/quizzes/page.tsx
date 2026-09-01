import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizzesClient from './client';
import { getProfile } from '@/lib/supabase/queries';

export default async function QuizzesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect('/onboarding');

  const isFaculty = profile.role !== 'student';
  let quizzes: any[] = [];

  if (isFaculty) {
    const { data } = await supabase
      .from('quizzes')
      .select('*, courses(title, code)')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    quizzes = data || [];
  } else {
    // Student enrolled courses
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    const courseIds = enrollments?.map(e => e.course_id) || [];
    if (courseIds.length > 0) {
      const { data } = await supabase
        .from('quizzes')
        .select('*, courses(title, code)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });
      
      // Get attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, status')
        .eq('student_id', user.id);
        
      const attemptsMap = new Map(attempts?.map(a => [a.quiz_id, a]));

      quizzes = (data || []).map(q => ({
        ...q,
        attempt: attemptsMap.get(q.id)
      }));
    }
  }

  return (
    <QuizzesClient 
      quizzes={quizzes} 
      isFaculty={isFaculty} 
    />
  );
}
