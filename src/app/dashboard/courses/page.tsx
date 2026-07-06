import { createClient } from '@/lib/supabase/server';
import CoursesClient from './courses-client';
import { getCourses, getEnrolledCourses, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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

  const allCourses = await getCourses(supabase);
  
  let enrolledCourses: any[] = [];
  if (profile.role === 'student') {
    enrolledCourses = await getEnrolledCourses(supabase, user.id);
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CoursesClient 
        allCourses={allCourses} 
        enrolledCourses={enrolledCourses}
        profile={profile}
      />
    </Suspense>
  );
}
