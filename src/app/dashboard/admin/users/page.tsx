import { getUserOrLocal } from '@/lib/supabase/get-user-or-local';
import { createClient } from '@/lib/supabase/server';
import AdminUsersClient from './users-client';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AdminUsersPage() {
  const user = await getUserOrLocal();

  if (!user) {
    redirect('/login');
  }

  let users: any[] = [];

  if (user.source === 'supabase') {
    const supabase = await createClient();
    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      redirect('/dashboard');
    }

    // Fetch all users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    users = usersData || [];
  }
  // For local-auth users the client-side useUser() hook provides the profile.

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminUsersClient initialUsers={users || []} />
    </Suspense>
  );
}
