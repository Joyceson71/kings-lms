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
        <div className="bg-card border border-border p-6 rounded-2xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Active IV Trips</h2>
            <Link href="/dashboard/iv-tracker/create">
              <Button>Create New Trip</Button>
            </Link>
          </div>
          
          {(!trips || trips.length === 0) ? (
            <div className="text-center py-12 bg-secondary/20 rounded-xl">
              <p className="text-muted-foreground mb-4">No active trips right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {trips.map(trip => (
                <Link key={trip.id} href={`/dashboard/iv-tracker/${trip.id}`} className="bg-secondary/20 p-4 rounded-xl flex justify-between items-center hover:bg-secondary/40 transition">
                  <div>
                    <h3 className="font-bold">{trip.name}</h3>
                    <p className="text-sm text-muted-foreground">Code: <span className="font-mono text-primary">{trip.trip_code}</span></p>
                  </div>
                  <Button variant="secondary">Manage Trip</Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border p-6 rounded-2xl text-center py-12 max-w-md mx-auto">
          <MapPin size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Join an IV Trip</h2>
          <p className="text-muted-foreground mb-6">Ask your faculty for the 6-character trip code to join the live map.</p>
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
            <div className="flex gap-2">
              <input 
                name="code" 
                placeholder="e.g. ABC123" 
                className="flex-1 bg-background border border-border rounded-lg px-4 uppercase text-center font-mono tracking-widest font-bold"
                maxLength={6}
                required
              />
              <Button type="submit">Join</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
