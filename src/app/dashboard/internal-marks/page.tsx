import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InternalMarksClient from './client';

export default async function InternalMarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, roll_number')
    .eq('id', user.id)
    .single();

  const isFaculty = profile?.role === 'faculty' || profile?.role === 'admin';

  // Fetch courses
  let courses = [];
  if (isFaculty) {
    const { data } = await supabase
      .from('courses')
      .select('id, title, code')
      .eq('faculty_id', user.id);
    courses = data || [];
  } else {
    const { data } = await supabase
      .from('course_enrollments')
      .select('courses(id, title, code)')
      .eq('student_id', user.id);
    courses = data?.map(d => d.courses).filter(Boolean) || [];
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Internal Verification (IV) Marks</h1>
        <p className="text-muted-foreground">Track internal assessment marks and attendance.</p>
      </div>

      <InternalMarksClient 
        userId={user.id} 
        isFaculty={isFaculty} 
        courses={courses} 
      />
    </div>
  );
}
