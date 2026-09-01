import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import QuizAttemptClient from './client';
import { getProfile } from '@/lib/supabase/queries';

export default async function QuizAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getProfile(supabase, user.id);
  if (!profile || profile.role !== 'student') redirect('/dashboard/quizzes');

  // Check if attempt exists
  let { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', id)
    .eq('student_id', user.id)
    .maybeSingle();

  if (attempt?.status === 'submitted') {
    redirect('/dashboard/quizzes');
  }

  if (!attempt) {
    // Start new attempt
    const { data: newAttempt, error } = await supabase
      .from('quiz_attempts')
      .insert({ quiz_id: id, student_id: user.id })
      .select()
      .single();
      
    if (error) redirect('/dashboard/quizzes');
    attempt = newAttempt;
  }

  // Fetch quiz and questions
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, courses(title)')
    .eq('id', id)
    .single();

  const { data: questions } = await supabase
    .from('questions')
    .select('*, question_options(*)')
    .eq('quiz_id', id)
    .order('order_index');

  return (
    <QuizAttemptClient 
      quiz={quiz} 
      questions={questions || []} 
      attemptId={attempt.id} 
    />
  );
}
