import { getUserOrLocal } from '@/lib/supabase/get-user-or-local';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
import { getDashboardStats, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUserOrLocal();

  if (!user) {
    redirect('/login');
  }

  let profile = null;
  let stats = { totalStudents: 0, totalCourses: 0, attendanceRate: 0, pendingAssignments: 0 };

  if (user.source === 'supabase') {
    const supabase = await createClient();
    profile = await getProfile(supabase, user.id);
    // Default to student if profile not yet completed fully or fetching failed
    const userRole = profile?.role || 'student';
    stats = await getDashboardStats(supabase, user.id, userRole);
  }
  // For local-auth users the client-side useUser() hook provides the profile.

  // In a real app we would fetch the grouped attendance data here,
  // but for now we'll pass the stats to the client component.

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardClient 
        stats={stats}
        profile={profile}
      />
    </Suspense>
  );
}
