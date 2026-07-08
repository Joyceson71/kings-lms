import { getUserOrLocal } from '@/lib/supabase/get-user-or-local';
import { createClient } from '@/lib/supabase/server';
import CoursesClient from './courses-client';
import { getCourses, getEnrolledCourses, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function CoursesPage() {
  const user = await getUserOrLocal();

  if (!user) {
    redirect('/login');
  }

  let profile = null;
  let allCourses: any[] = [];
  let enrolledCourses: any[] = [];

  if (user.source === 'supabase') {
    const supabase = await createClient();
    profile = await getProfile(supabase, user.id);
    if (!profile) {
      redirect('/onboarding');
    }
    allCourses = await getCourses(supabase);
    if (profile.role === 'student') {
      enrolledCourses = await getEnrolledCourses(supabase, user.id);
    }
  }
  // For local-auth users the client-side useUser() hook provides the profile.

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
