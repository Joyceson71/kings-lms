import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminOverviewClient from './admin-overview-client';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return <AdminOverviewClient />;
}
