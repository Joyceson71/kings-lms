import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function IVTrackerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorParam } = await searchParams;
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

  const role = profile?.role || 'student';

  const { data: trips } = await supabase
    .from('iv_trips')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/20 text-primary rounded-xl">
          <MapPin size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">IV Location Tracker</h1>
          <p className="text-muted-foreground">Real-time location sharing and gather points for industrial visits.</p>
        </div>
      </div>

      {(role === 'faculty' || role === 'admin') ? (
        <div className="clay-card p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Active IV Trips</h2>
            <Link href="/dashboard/iv-tracker/create">
              <Button>Create New Trip</Button>
            </Link>
          </div>
          
          {(!trips || trips.length === 0) ? (
            <div className="text-center py-16 neo-inset rounded-[2rem]">
              <p className="text-muted-foreground font-medium">No active trips right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {trips.map(trip => (
                <Link key={trip.id} href={`/dashboard/iv-tracker/${trip.id}`} className="neo-btn p-6 rounded-[2rem] flex justify-between items-center transition-all">
                  <div>
                    <h3 className="font-bold text-lg">{trip.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md ml-1">{trip.trip_code}</span></p>
                  </div>
                  <Button className="rounded-full px-6 font-bold shadow-md">Manage Trip</Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="clay-card p-10 text-center max-w-md mx-auto">
          <MapPin size={56} className="mx-auto text-primary mb-6 animate-float" />
          <h2 className="text-2xl font-black mb-3">Join an IV Trip</h2>
          <p className="text-muted-foreground mb-8">Ask your faculty for the 6-character trip code to join the live map.</p>
          {errorParam && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm font-medium border border-red-500/20">
              {errorParam}
            </div>
          )}
          
          <form action={async (formData) => {
            'use server';
            const code = formData.get('code')?.toString().toUpperCase();
            if (!code) return;
            const sb = await createClient();
            const { data } = await sb.from('iv_trips').select('id').eq('trip_code', code).eq('active', true).single();
            if (data) {
              redirect(`/dashboard/iv-tracker/${data.id}`);
            } else {
              redirect('/dashboard/iv-tracker?error=Invalid or expired trip code.');
            }
          }} className="flex flex-col gap-2">
            <div className="flex flex-col gap-4">
              <input 
                name="code" 
                placeholder="e.g. ABC123" 
                className="w-full neo-input rounded-2xl px-6 py-4 uppercase text-center font-mono tracking-[0.2em] font-black text-lg"
                maxLength={6}
                required
              />
              <Button type="submit" className="w-full rounded-2xl py-6 font-black text-lg shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:scale-[1.02] transition-transform">
                Join Trip
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
