import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './client';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_complete) {
    redirect('/dashboard');
  }

  const { data: departments } = await supabase.from('departments').select('*').order('name');
  const { data: courses } = await supabase.from('courses').select('id, title, code').order('title');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[var(--background)] -z-20" />
      <div className="absolute inset-0 bg-grid -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <OnboardingClient 
        user={user} 
        profile={profile} 
        departments={departments || []} 
        courses={courses || []} 
      />
    </div>
  );
}
