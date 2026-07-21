import { createClient } from '@/lib/supabase/server';
import CoursesClient from './courses-client';
import { getCourses, getEnrolledCourses, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    redirect('/onboarding');
  }

  const allCourses = await getCourses(supabase, profile.role === 'student' ? profile.department || undefined : undefined);
  let enrolledCourses: Awaited<ReturnType<typeof getEnrolledCourses>> = [];
  if (profile.role === 'student') {
    enrolledCourses = await getEnrolledCourses(supabase, user.id);
  }

  return (
    <CoursesClient
      allCourses={allCourses}
      enrolledCourses={enrolledCourses}
      profile={profile}
    />
  );
}
