import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CourseDetailClient from './client';
import { getProfile } from '@/lib/supabase/queries';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await getProfile(supabase, user.id);
  if (!profile) redirect('/onboarding');

  // Fetch Course details
  const { data: course, error } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !course) redirect('/dashboard/courses');

  // Fetch Modules & Resources
  const { data: modules } = await supabase
    .from('modules')
    .select('*, resources(*)')
    .eq('course_id', id)
    .order('order_index');

  const isFaculty = profile.role !== 'student' && course.created_by === user.id;

  return (
    <CourseDetailClient 
      course={course} 
      initialModules={modules || []} 
      isFaculty={isFaculty} 
    />
  );
}
