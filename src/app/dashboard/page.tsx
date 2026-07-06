import { createClient } from '@/lib/supabase/server';
import DashboardClient from './dashboard-client';
import { getDashboardStats, getProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, user.id);
  // Default to student if profile not yet completed fully or fetching failed
  const userRole = profile?.role || 'student';

  const stats = await getDashboardStats(supabase, user.id, userRole);

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
