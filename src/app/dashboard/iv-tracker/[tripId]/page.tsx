import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripClient from '@/app/dashboard/iv-tracker/[tripId]/trip-client';

export default async function IVTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: trip } = await supabase
    .from('iv_trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    redirect('/dashboard/iv-tracker');
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col md:flex-row relative">
      <TripClient 
        tripId={tripId}
        currentUserId={user.id}
        role={profile?.role || 'student'}
        mapBounds={trip.map_bounds}
        isActive={trip.active}
        joinCode={trip.join_code}
      />
    </div>
  );
}
